"""Procedural sound effects library. Each function returns mono float32."""
from __future__ import annotations

import numpy as np

from synth import RNG, SR, bp, brown, exp_decay, hp, lp, pink, saw, secs, sine, sweep_filter, white


def wind(dur, strength=1.0, rng=RNG):
    x = brown(dur, rng) * 0.5 + pink(dur, rng) * 0.25
    t = np.arange(len(x)) / SR
    gust = 0.55 + 0.45 * np.sin(2 * np.pi * 0.07 * t + 1.3) * np.sin(2 * np.pi * 0.023 * t + 0.4)
    y = bp(x, 120, 900) * gust
    whistle = bp(pink(dur, rng), 900, 1400) * (gust**3) * 0.25
    return (y + whistle) * 0.35 * strength


def fire_crackle(dur, density=6, rng=RNG):
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    for _ in range(int(dur * density)):
        p = rng.integers(0, n - 2000)
        L = rng.integers(60, 600)
        c = hp(white(L / SR, rng), 1500) * exp_decay(L, 0.002) * rng.uniform(0.2, 1)
        y[p : p + L] += c
    y += lp(brown(dur, rng), 300) * 0.15
    return y * 0.4


def distant_boom(vel=1.0, rng=RNG):
    dur = 4.5
    n = secs(dur)
    t = np.arange(n) / SR
    x = lp(white(dur, rng), 180, 4) * np.exp(-t / 0.9) * 2.4
    rumble = lp(brown(dur, rng), 90) * np.exp(-t / 1.6) * 0.8
    att = np.minimum(1, t / 0.03)
    return ((x + rumble) * att * vel * 0.9).astype(np.float32)


def room_tone(dur, level=0.06, rng=RNG):
    return lp(pink(dur, rng), 700) * level + sine(100, dur) * 0.002


def hum(dur, f=100, level=0.01):
    return (sine(f, dur) + 0.4 * sine(2 * f, dur) + 0.2 * sine(3 * f, dur)) * level


def key_click(vel=1.0, rng=RNG):
    L = secs(0.05)
    t = np.arange(L) / SR
    click = hp(white(0.05, rng), 2500) * np.exp(-t / 0.004)
    thock = lp(white(0.05, rng), 600) * np.exp(-t / 0.012) * 0.8
    tone = np.sin(2 * np.pi * rng.uniform(1800, 2600) * t) * np.exp(-t / 0.006) * 0.3
    return ((click * 0.6 + thock + tone) * vel * 0.5).astype(np.float32)


def typing(dur, rate=8.0, rng=RNG):
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    t = 0.0
    while t < dur - 0.06:
        c = key_click(rng.uniform(0.5, 1.0), rng)
        p = secs(t)
        y[p : p + len(c)] += c[: n - p]
        t += rng.gamma(2.0, 1 / (rate * 2))
        if rng.random() < 0.06:
            t += rng.uniform(0.2, 0.5)  # thinking pause
    return y


def paper_rustle(dur=0.6, vel=1.0, rng=RNG):
    n = secs(dur)
    x = bp(white(dur, rng), 1500, 9000)
    jit = np.abs(lp(rng.standard_normal(n), 30)) * 6
    e = np.sin(np.linspace(0, np.pi, n)) ** 0.7
    return (x * jit * e * 0.35 * vel).astype(np.float32)


def paper_slide(dur=0.8, vel=1.0, rng=RNG):
    n = secs(dur)
    x = bp(pink(dur, rng), 400, 5000)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return (x * e * 0.3 * vel).astype(np.float32)


def pen_scratch(dur=1.8, rng=RNG):
    n = secs(dur)
    x = bp(white(dur, rng), 2500, 9000)
    # stroke rhythm of a handwritten signature
    t = np.arange(n) / SR
    strokes = (np.sin(2 * np.pi * 5.5 * t + 2 * np.sin(2 * np.pi * 1.3 * t)) > -0.3).astype(np.float32)
    strokes = lp(strokes, 40)
    friction = 0.6 + 0.4 * np.abs(lp(RNG.standard_normal(n), 200)) * 4
    e = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.1)
    return (x * strokes * friction * e * 0.22).astype(np.float32)


def page_flip(vel=1.0, rng=RNG):
    a = paper_rustle(0.35, vel, rng)
    flap = lp(white(0.12, rng), 1200) * exp_decay(secs(0.12), 0.03) * 0.5 * vel
    out = np.zeros(secs(0.5), dtype=np.float32)
    out[: len(a)] += a
    p = secs(0.28)
    out[p : p + len(flap)] += flap
    return out


def folder_close(vel=1.0, rng=RNG):
    L = secs(0.4)
    t = np.arange(L) / SR
    thump = lp(white(0.4, rng), 400) * np.exp(-t / 0.05) * 1.2
    slap = bp(white(0.4, rng), 800, 4000) * np.exp(-t / 0.015) * 0.6
    return ((thump + slap) * vel).astype(np.float32)


def clock_tick(vel=1.0, rng=RNG, tock=False):
    L = secs(0.06)
    t = np.arange(L) / SR
    f = 3200 if not tock else 2600
    return ((np.sin(2 * np.pi * f * t) * 0.5 + hp(white(0.06, rng), 3000) * 0.5) * np.exp(-t / 0.005) * 0.4 * vel).astype(np.float32)


def footstep(surface="gravel", vel=1.0, rng=RNG):
    L = secs(0.3)
    t = np.arange(L) / SR
    heel = lp(white(0.3, rng), 300) * np.exp(-t / 0.025) * 1.2
    if surface == "gravel":
        crunch = bp(white(0.3, rng), 1200, 7000) * np.exp(-t / 0.07) * (np.abs(lp(rng.standard_normal(L), 400)) * 5) * 0.35
    else:
        crunch = bp(white(0.3, rng), 600, 3000) * np.exp(-t / 0.02) * 0.3
    return ((heel + crunch) * vel * 0.6).astype(np.float32)


def footsteps(dur, rate=1.9, people=1, surface="gravel", rng=RNG):
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    for p_i in range(people):
        t = rng.uniform(0, 0.5)
        r = rate * rng.uniform(0.9, 1.1)
        v = rng.uniform(0.4, 1.0) if people > 1 else 1.0
        while t < dur - 0.3:
            s = footstep(surface, v * rng.uniform(0.8, 1.1), rng)
            p = secs(t)
            y[p : p + len(s)] += s[: n - p]
            t += 1 / r * rng.uniform(0.94, 1.06)
    return y / max(1, np.sqrt(people))


def engine(dur, f0=38.0, f1=None, level=1.0, rng=RNG):
    """Diesel engine: pulsed low harmonics + rumble. f0→f1 rpm glide."""
    n = secs(dur)
    f1 = f1 or f0
    f = np.linspace(f0, f1, n)
    ph = np.cumsum(f) / SR
    pulse = (np.sin(2 * np.pi * ph) > 0.6).astype(np.float32)
    body = lp(pulse, 400) * 0.8 + saw(f, dur) * 0.3
    rumble = lp(brown(dur, rng), 120) * 0.6
    y = lp(body, 900) + rumble
    return y * 0.35 * level


def air_brake(rng=RNG):
    dur = 1.1
    n = secs(dur)
    t = np.arange(n) / SR
    x = hp(white(dur, rng), 2500) * np.exp(-t / 0.35) * np.minimum(1, t / 0.01)
    squeal = sine(np.linspace(2100, 1700, n), dur) * np.exp(-t / 0.3) * 0.08
    return (x * 0.35 + squeal).astype(np.float32)


def door_pneumatic(rng=RNG):
    dur = 0.9
    n = secs(dur)
    t = np.arange(n) / SR
    hiss = bp(white(dur, rng), 1500, 8000) * np.exp(-t / 0.25) * 0.3
    clunk = lp(white(dur, rng), 500) * np.exp(-((t - 0.55) ** 2) / 0.0004) * 0.8
    return (hiss + clunk).astype(np.float32)


def whistle(dur=0.9, rng=RNG):
    n = secs(dur)
    t = np.arange(n) / SR
    trill = 1 + 0.03 * np.sign(np.sin(2 * np.pi * 28 * t))
    y = sine(2900 * trill, dur) * 0.4 + bp(white(dur, rng), 2500, 3500) * 0.15
    e = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.08)
    return (y * e * 0.5).astype(np.float32)


def truck_interior(dur, rng=RNG):
    n = secs(dur)
    t = np.arange(n) / SR
    eng = engine(dur, 34, 36, 1.0, rng)
    road = lp(brown(dur, rng), 250) * 0.5
    rattles = np.zeros(n, dtype=np.float32)
    for _ in range(int(dur * 7)):
        p = rng.integers(0, n - 3000)
        L = rng.integers(400, 2500)
        rattles[p : p + L] += bp(white(L / SR, rng), 800, 5000) * exp_decay(L, 0.01) * rng.uniform(0.05, 0.25)
    bumps = np.zeros(n, dtype=np.float32)
    for _ in range(int(dur * 0.6)):
        p = rng.integers(0, n - 20000)
        L = 20000
        tt = np.arange(L) / SR
        bumps[p : p + L] += lp(white(L / SR, rng), 120) * np.exp(-tt / 0.15) * 0.8
    return eng + road + rattles + bumps


def murmur(dur, rng=RNG):
    """Indistinct crowd hum (used under TTS walla)."""
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    for k in range(5):
        x = bp(pink(dur, rng), 250 + k * 120, 900 + k * 300)
        mod = np.abs(lp(rng.standard_normal(n), 5)) * 4
        y += x * mod
    return lp(y, 2500) * 0.05


def birds(dur, rng=RNG):
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    t = rng.uniform(0.5, 2)
    while t < dur - 1:
        L = secs(0.12)
        tt = np.arange(L) / SR
        f = rng.uniform(3500, 5200)
        chirp = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 18 * tt)) * tt) * np.sin(np.pi * tt / tt[-1]) * 0.05
        for rep in range(rng.integers(1, 4)):
            p = secs(t + rep * 0.14)
            if p + L < n:
                y[p : p + L] += chirp
        t += rng.uniform(1.5, 4)
    return y


def drill_distant(dur, rng=RNG):
    """Distant group marching / running on a parade ground."""
    steps = footsteps(dur, rate=2.6, people=8, surface="hard", rng=rng)
    return lp(steps, 1500) * 0.5
