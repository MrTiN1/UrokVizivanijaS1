"""Small procedural audio toolkit (numpy/scipy): noises, filters, envelopes,
instruments (pad, piano, pulse, braam), impacts and a convolution reverb.
All sound in the series is generated here or by TTS — no third-party
samples, so there are no licensing questions."""
from __future__ import annotations

import numpy as np
from scipy import signal

SR = 48000
RNG = np.random.default_rng(7)


def secs(n: float) -> int:
    return int(round(n * SR))


def t_axis(dur: float) -> np.ndarray:
    return np.arange(secs(dur)) / SR


def midi(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def n2m(name: str) -> int:
    """'D3' -> midi"""
    if name[1:2] in ("#", "b"):
        p, o = name[:2], name[2:]
    else:
        p, o = name[:1], name[1:]
    return 12 * (int(o) + 1) + NOTE[p]


# ---------------- noise & filters ----------------
def white(dur: float, rng=RNG) -> np.ndarray:
    return rng.standard_normal(secs(dur)).astype(np.float32)


def pink(dur: float, rng=RNG) -> np.ndarray:
    n = secs(dur)
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.arange(len(X))
    f[0] = 1
    X = X / np.sqrt(f)
    y = np.fft.irfft(X, n)
    return (y / (np.std(y) + 1e-9)).astype(np.float32)


def brown(dur: float, rng=RNG) -> np.ndarray:
    x = np.cumsum(rng.standard_normal(secs(dur)))
    x = signal.sosfilt(signal.butter(1, 20, "hp", fs=SR, output="sos"), x)
    return (x / (np.std(x) + 1e-9)).astype(np.float32)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, min(f, SR / 2 - 100), "lp", fs=SR, output="sos"), x).astype(np.float32)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "hp", fs=SR, output="sos"), x).astype(np.float32)


def bp(x, f1, f2, order=2):
    return signal.sosfilt(signal.butter(order, [f1, min(f2, SR / 2 - 100)], "bp", fs=SR, output="sos"), x).astype(np.float32)


def sweep_filter(x, f0, f1, kind="lp", blocks=64):
    """Time-varying filter by block processing with crossfaded states."""
    n = len(x)
    out = np.zeros_like(x)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for i in range(blocks):
        a, b = edges[i], edges[i + 1]
        f = f0 * (f1 / f0) ** (i / max(1, blocks - 1))
        sos = signal.butter(2, min(f, SR / 2 - 200), kind, fs=SR, output="sos")
        pad = min(a, 2048)
        seg = signal.sosfilt(sos, x[a - pad : b])[pad:]
        out[a:b] = seg
    return out


# ---------------- envelopes ----------------
def env_adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    a_n, d_n, r_n = secs(a), secs(d), secs(r)
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate(
        [
            np.linspace(0, 1, max(1, a_n), endpoint=False),
            np.linspace(1, s, max(1, d_n), endpoint=False),
            np.full(s_n, s),
            np.linspace(s, 0, max(1, r_n)),
        ]
    )
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def fade(x: np.ndarray, fin: float = 0.01, fout: float = 0.01) -> np.ndarray:
    y = x.copy()
    a, b = secs(fin), secs(fout)
    if a:
        y[:a] *= np.linspace(0, 1, a)
    if b:
        y[-b:] *= np.linspace(1, 0, b)
    return y


def exp_decay(n: int, tau: float) -> np.ndarray:
    return np.exp(-np.arange(n) / (tau * SR)).astype(np.float32)


# ---------------- oscillators ----------------
def saw(freq, dur, phase=0.0):
    t = t_axis(dur)
    if np.isscalar(freq):
        ph = freq * t + phase
    else:
        ph = np.cumsum(freq) / SR + phase
    # band-limited-ish saw: sum of harmonics up to 8k
    f0 = float(np.max(freq)) if not np.isscalar(freq) else freq
    nh = max(1, int(8000 / max(f0, 20)))
    nh = min(nh, 40)
    y = np.zeros_like(t)
    for k in range(1, nh + 1):
        y += np.sin(2 * np.pi * k * ph) / k * (1 - k / (nh + 1)) ** 0.5
    return (y * 0.55).astype(np.float32)


def sine(freq, dur, phase=0.0):
    t = t_axis(dur)
    if np.isscalar(freq):
        return np.sin(2 * np.pi * freq * t + phase).astype(np.float32)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR + phase).astype(np.float32)


def tri(freq, dur):
    t = t_axis(dur)
    return (2 * np.abs(2 * ((freq * t) % 1) - 1) - 1).astype(np.float32)


# ---------------- instruments ----------------
def pad(notes: list[float], dur: float, cutoff=1200, attack=1.5, release=2.0, detune=0.12, bright=0.5, rng=RNG):
    """Warm detuned-saw string/synth pad."""
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    for m in notes:
        for d in (-detune, 0, detune):
            f = midi(m + d)
            vib = 1 + 0.0025 * np.sin(2 * np.pi * (4.6 + rng.random()) * t_axis(dur) + rng.random() * 6)
            y += saw(f * vib, dur, rng.random()) * 0.33
            y += sine(f * 0.5, dur) * 0.08 * (1 - bright)
    y = lp(y, cutoff, 2)
    y *= env_adsr(n, attack, 0.5, 0.85, release)
    return y / max(1, len(notes)) * 1.6


def strings(notes, dur, cutoff=2400, attack=2.0, release=2.5):
    y = pad(notes, dur, cutoff=cutoff, attack=attack, release=release, detune=0.08, bright=0.8)
    return hp(y, 120)


def piano(m: float, dur: float = 3.5, vel: float = 0.7, bright: float = 0.6):
    """Felt-piano-ish additive tone with inharmonic partials and hammer noise."""
    n = secs(dur)
    t = np.arange(n) / SR
    f0 = midi(m)
    y = np.zeros(n, dtype=np.float32)
    B = 0.0004
    for k in range(1, 12):
        fk = f0 * k * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = (1 / k ** (1.6 - bright * 0.6)) * vel
        tau = 1.8 / (1 + 0.35 * k) * (220 / max(f0, 80)) ** 0.25
        y += amp * np.sin(2 * np.pi * fk * t + RNG.random()) * np.exp(-t / tau)
    hammer = lp(white(0.02), 3000) * np.linspace(1, 0, secs(0.02)) * 0.15 * vel
    y[: len(hammer)] += hammer
    y *= env_adsr(n, 0.004, 0.05, 1.0, 0.3)
    return lp(y, 2500 + bright * 3000).astype(np.float32) * 0.6


def pluck_low(m: float, dur=0.5, vel=0.8):
    n = secs(dur)
    t = np.arange(n) / SR
    f = midi(m)
    y = (saw(f, dur) * 0.6 + sine(f / 2, dur) * 0.5) * np.exp(-t / 0.16)
    return lp(y, 700) * vel


def heartbeat(vel=1.0):
    def thump(f, d, a):
        n = secs(d)
        t = np.arange(n) / SR
        fr = f * (1 + 1.5 * np.exp(-t / 0.02))
        return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / (d / 4)) * a

    a = thump(55, 0.35, 1.0)
    b = thump(48, 0.4, 0.7)
    out = np.zeros(secs(0.75), dtype=np.float32)
    out[: len(a)] += a
    o = secs(0.24)
    out[o : o + len(b)] += b[: len(out) - o]
    return lp(out, 160) * vel


def impact(dur=4.0, sub=55, vel=1.0, rng=RNG):
    """Cinematic hit: pitch-dropping sub + noise burst + low saw body."""
    n = secs(dur)
    t = np.arange(n) / SR
    fr = sub * (0.55 + 1.2 * np.exp(-t / 0.08))
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 1.1)
    nz = lp(white(dur, rng), 1800) * np.exp(-t / 0.12) * 0.6
    low = lp(saw(sub / 2, dur) + saw(sub / 2 * 1.007, dur), 220) * np.exp(-t / 1.6) * 0.5
    y = body + nz + low
    return (np.tanh(y * 1.4) * vel).astype(np.float32)


def braam(m=n2m("D1"), dur=4.5, vel=1.0):
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    for mm, a in ((m, 1), (m + 12, 0.7), (m + 19, 0.35), (m + 24, 0.25)):
        for d in (-0.1, 0.1):
            y += saw(midi(mm + d), dur) * a
    y = sweep_filter(y, 2400, 180, "lp", 48)
    y = np.tanh(y * 1.8) * env_adsr(n, 0.02, 0.4, 0.6, dur * 0.7)
    return (y * 0.5 * vel).astype(np.float32)


def riser(dur=1.6, f0=300, f1=6000, vel=0.6, rng=RNG):
    x = white(dur, rng)
    y = sweep_filter(x, f0, f1, "lp", 48)
    tone_f = np.geomspace(midi(n2m("D3")), midi(n2m("D5")), secs(dur))
    tone = sine(tone_f, dur) * 0.25
    e = np.linspace(0, 1, secs(dur)) ** 2.2
    return ((y * 0.5 + tone) * e * vel).astype(np.float32)


def whoosh(dur=0.9, vel=0.7, rng=RNG):
    x = pink(dur, rng)
    y = sweep_filter(x, 200, 5000, "lp", 32)
    n = secs(dur)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return (y * e * vel).astype(np.float32)


# ---------------- reverb ----------------
_IR_CACHE: dict = {}


def reverb_ir(seconds=2.5, damp=4000, seed=1):
    key = (seconds, damp, seed)
    if key not in _IR_CACHE:
        rng = np.random.default_rng(seed)
        n = secs(seconds)
        t = np.arange(n) / SR
        irs = []
        for ch in range(2):
            x = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds)
            x = lp(x, damp)
            x[: secs(0.008)] *= np.linspace(0, 1, secs(0.008))
            irs.append(x / np.sqrt(np.sum(x**2)))
        _IR_CACHE[key] = irs
    return _IR_CACHE[key]


def reverb(x: np.ndarray, seconds=2.5, mix=0.3, damp=4000) -> np.ndarray:
    """Mono in → stereo out (2, n)."""
    irs = reverb_ir(seconds, damp)
    wet = [signal.fftconvolve(x, ir)[: len(x)] for ir in irs]
    dry = np.stack([x, x])
    return (dry * (1 - mix) + np.stack(wet) * mix * 1.2).astype(np.float32)


def pan(x: np.ndarray, p: float) -> np.ndarray:
    """mono → stereo with constant-power pan p in [-1, 1]"""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)]).astype(np.float32)
