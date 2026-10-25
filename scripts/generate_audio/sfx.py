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


# ---------------- night city / bus («Последний автобус») ----------------
def rain(dur, strength=1.0, rng=RNG):
    """Outdoor rain: dense hiss + random drops on hard surfaces."""
    n = secs(dur)
    hiss = bp(pink(dur, rng), 400, 9000) * 0.35
    drops = np.zeros(n, dtype=np.float32)
    for _ in range(int(dur * 90)):
        p = rng.integers(0, max(1, n - 800))
        L = rng.integers(120, 700)
        tt = np.arange(L) / SR
        f = rng.uniform(1500, 6000)
        drops[p : p + L] += (np.sin(2 * np.pi * f * tt) * 0.4 + hp(white(L / SR, rng), 2000)) * np.exp(-tt / 0.004) * rng.uniform(0.05, 0.3)
    low = lp(brown(dur, rng), 200) * 0.15
    return (hiss + drops + low) * strength * 0.5


def rain_window(dur, strength=1.0, rng=RNG):
    """Rain heard from inside: muffled patter on glass + occasional drips."""
    x = lp(rain(dur, 1.0, rng), 2200) * 0.8
    n = len(x)
    for _ in range(int(dur * 3)):
        p = rng.integers(0, max(1, n - 4000))
        L = 3000
        tt = np.arange(L) / SR
        x[p : p + L] += np.sin(2 * np.pi * rng.uniform(700, 1400) * tt * (1 - tt * 2)) * np.exp(-tt / 0.02) * 0.08
    return x * strength


def bus_interior(dur, rng=RNG):
    """Old city bus cabin: diesel idle/drive, road roar, window rattles, tube hum."""
    n = secs(dur)
    eng = engine(dur, 30, 32, 0.9, rng)
    road = lp(brown(dur, rng), 180) * 0.45
    rattles = np.zeros(n, dtype=np.float32)
    for _ in range(int(dur * 4)):
        p = rng.integers(0, max(1, n - 3000))
        L = rng.integers(400, 2500)
        rattles[p : p + L] += bp(white(L / SR, rng), 1200, 6000) * exp_decay(L, 0.008) * rng.uniform(0.03, 0.12)
    tube = (sine(100, dur) + 0.5 * sine(200, dur) + 0.2 * sine(300, dur)) * 0.006
    return eng * 0.8 + road + rattles + tube


def lamp_buzz(dur=0.6, rng=RNG):
    """Fluorescent tube stutter: buzzing bursts with clicks."""
    n = secs(dur)
    t = np.arange(n) / SR
    gate = (np.sin(2 * np.pi * 9 * t + rng.uniform(0, 6)) > 0).astype(np.float32)
    buzz = (saw(100, dur) * 0.4 + saw(200, dur) * 0.2) * gate
    clicks = np.zeros(n, dtype=np.float32)
    edges = np.where(np.diff(gate) != 0)[0]
    for e in edges:
        L = min(600, n - e)
        clicks[e : e + L] += hp(white(L / SR, rng), 3000) * np.exp(-np.arange(L) / SR / 0.002) * 0.5
    return (bp(buzz, 90, 3000) * 0.3 + clicks) * 0.6


def door_heavy(rng=RNG):
    """Heavy glass entrance door opening (squeak + latch + whoosh)."""
    dur = 1.4
    n = secs(dur)
    t = np.arange(n) / SR
    latch = lp(white(dur, rng), 900) * np.exp(-t / 0.03) * 0.8
    squeak = sine(np.linspace(900, 1300, n), dur) * np.exp(-((t - 0.3) ** 2) / 0.02) * 0.05
    air = bp(pink(dur, rng), 200, 1500) * np.sin(np.pi * np.minimum(1, t / 1.2)) * 0.2
    return (latch + squeak + air).astype(np.float32)


def phone_tap(rng=RNG):
    dur = 0.12
    t = np.arange(secs(dur)) / SR
    return (np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.008) * 0.2 + hp(white(dur, rng), 3000) * np.exp(-t / 0.003) * 0.2).astype(np.float32)


def phone_notify(rng=RNG):
    """Two soft bell tones (original)."""
    dur = 1.2
    t = np.arange(secs(dur)) / SR
    a = np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t / 0.25)
    b = np.sin(2 * np.pi * 1975.5 * np.maximum(0, t - 0.14)) * np.exp(-np.maximum(0, t - 0.14) / 0.35) * (t > 0.14)
    return ((a + b * 0.8) * 0.22).astype(np.float32)


def phone_error(rng=RNG):
    dur = 0.5
    t = np.arange(secs(dur)) / SR
    tone = np.sin(2 * np.pi * 440 * t) * ((t < 0.12) | ((t > 0.2) & (t < 0.32)))
    return (tone * 0.12).astype(np.float32)


def bus_approach(dur=3.6, rng=RNG):
    """Bus engine coming closer + tyres on wet road (swish), slowing down."""
    n = secs(dur)
    t = np.arange(n) / SR
    eng = engine(dur, 46, 30, 1.0, rng)
    swish = bp(pink(dur, rng), 500, 5000) * 0.5
    env = (t / dur) ** 1.6
    return ((eng + swish) * env).astype(np.float32)


def bus_step(rng=RNG):
    s = footstep("hard", 1.2, rng)
    clank = bp(white(0.3, rng), 300, 1200) * np.exp(-np.arange(len(s)) / SR / 0.05) * 0.4
    return (s + clank[: len(s)]).astype(np.float32)


def seat_creak(rng=RNG):
    dur = 0.7
    n = secs(dur)
    t = np.arange(n) / SR
    f = 260 + 80 * np.sin(2 * np.pi * 3 * t)
    creak = bp(saw(f, dur), 300, 2500) * np.exp(-((t - 0.3) ** 2) / 0.03) * 0.15
    thump = lp(white(dur, rng), 200) * np.exp(-t / 0.05) * 0.6
    return (creak + thump).astype(np.float32)


def pass_by(dur=2.2, rng=RNG):
    """Something passing the window: air swell (stop shelter / lamp post)."""
    n = secs(dur)
    t = np.arange(n) / SR
    env = np.exp(-((t - dur / 2) ** 2) / 0.12)
    x = bp(pink(dur, rng), 300, 3000) * env * 0.5
    return x.astype(np.float32)


def footsteps_wet(dur, rate=1.8, rng=RNG):
    """Footsteps on wet pavement: heel + splash."""
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    t = rng.uniform(0, 0.2)
    while t < dur - 0.3:
        s = footstep("hard", rng.uniform(0.7, 1.0), rng)
        L = len(s)
        tt = np.arange(L) / SR
        splash = bp(white(L / SR, rng), 1500, 8000) * np.exp(-tt / 0.05) * 0.35
        p = secs(t)
        y[p : p + L] += (s + splash)[: n - p]
        t += 1 / rate * rng.uniform(0.95, 1.05)
    return y


def sub_drop(rng=RNG):
    dur = 3.0
    t = np.arange(secs(dur)) / SR
    f = 70 * np.exp(-t / 1.2) + 28
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.4) * 0.8).astype(np.float32)


def sting(rng=RNG):
    """Dissonant string stab + low hit (original, non-shock)."""
    dur = 3.0
    t = np.arange(secs(dur)) / SR
    tones = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([220.0, 233.1, 329.6, 349.2]))
    env = np.minimum(1, t / 0.04) * np.exp(-t / 1.0)
    low = lp(white(dur, rng), 120) * np.exp(-t / 0.4)
    return ((bp(tones, 150, 4000) * 0.12 + low * 0.6) * env).astype(np.float32)


# ---------------- episode 2 «Пустое место» ----------------
def tyres_wet(dur, rng=RNG):
    """Continuous swish of tyres on a wet road (slowly varying)."""
    n = secs(dur)
    t = np.arange(n) / SR
    x = bp(pink(dur, rng), 600, 6000)
    mod = 0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * t) * np.sin(2 * np.pi * 0.05 * t + 1)
    return (x * mod * 0.35).astype(np.float32)


def brake_squeal(rng=RNG):
    """Hard stop: tyre hiss + brake squeal + body thump."""
    dur = 1.8
    n = secs(dur)
    t = np.arange(n) / SR
    hiss = bp(white(dur, rng), 1500, 8000) * np.exp(-t / 0.6) * 0.3
    squeal = sine(np.linspace(1900, 1500, n), dur) * np.exp(-((t - 0.5) ** 2) / 0.12) * 0.06
    thump = lp(white(dur, rng), 140) * np.exp(-np.maximum(0, t - 1.1) / 0.12) * (t > 1.1) * 0.9
    return (hiss + squeal + thump).astype(np.float32)


def glass_squeak(rng=RNG):
    """A palm pressed / dragged on wet glass."""
    dur = 0.6
    n = secs(dur)
    t = np.arange(n) / SR
    f = 700 + 300 * np.sin(2 * np.pi * 2.2 * t)
    sq = bp(saw(f, dur), 500, 3500) * np.exp(-((t - 0.25) ** 2) / 0.02) * 0.12
    press = lp(white(dur, rng), 300) * np.exp(-t / 0.04) * 0.4
    return (sq + press).astype(np.float32)


def whoosh_hit(rng=RNG):
    """Fast camera whip: short whoosh into a soft low hit (not a scare)."""
    dur = 1.2
    n = secs(dur)
    t = np.arange(n) / SR
    w = bp(pink(dur, rng), 300, 4000) * np.exp(-((t - 0.18) ** 2) / 0.006) * 0.6
    hit = lp(white(dur, rng), 160) * np.exp(-np.maximum(0, t - 0.22) / 0.25) * (t > 0.22) * 0.6
    return (w + hit).astype(np.float32)


# ---------------- «Звонок от себя» ----------------
def room(dur, rng=RNG):
    """Quiet flat at night: room tone, fridge hum through the wall, faint ticking."""
    x = room_tone(dur, 0.05, rng) + hum(dur, 50, 0.004) + lp(brown(dur, rng), 90) * 0.05
    n = len(x)
    for k in range(int(dur)):
        p = secs(k + 0.3)
        if p + 600 < n:
            tt = np.arange(600) / SR
            x[p : p + 600] += hp(white(600 / SR, rng), 3000) * np.exp(-tt / 0.003) * 0.03
    return x


def ringtone(dur=4.5, rng=RNG):
    """Original marimba-like ringtone (two short phrases)."""
    n = secs(dur)
    y = np.zeros(n, dtype=np.float32)
    notes = [76, 79, 83, 79, 76, 79, 83, 86]
    for rep in range(3):
        for i, m_ in enumerate(notes):
            t0 = rep * 1.5 + i * 0.16
            if t0 > dur - 0.4:
                break
            f = 440 * 2 ** ((m_ - 69) / 12)
            L = secs(0.35)
            tt = np.arange(L) / SR
            tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 4 * f * tt)) * np.exp(-tt / 0.09)
            p = secs(t0)
            y[p : p + L] += tone[: n - p] * 0.25
    return y


def vibrate(dur=4.5, rng=RNG):
    """Phone buzzing on a desk: 0.4 s pulses."""
    n = secs(dur)
    t = np.arange(n) / SR
    gate = ((t % 0.9) < 0.42).astype(np.float32)
    buzz = (np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + lp(white(dur, rng), 400)) * gate
    return (lp(buzz, 900) * 0.25).astype(np.float32)


def typing_short(rng=RNG):
    return typing(1.6, 7.0, rng)


def dial_tone(rng=RNG):
    """Ringback beeps (425 Hz, 1 s on / 2 s off) for ~3 s."""
    dur = 3.0
    t = np.arange(secs(dur)) / SR
    gate = ((t % 3.0) < 1.0).astype(np.float32)
    return (np.sin(2 * np.pi * 425 * t) * gate * 0.12).astype(np.float32)


def error_tone(rng=RNG):
    """Three rising tones of an operator message (generic, original)."""
    y = []
    for f in (950, 1400, 1800):
        tt = np.arange(secs(0.33)) / SR
        y.append(np.sin(2 * np.pi * f * tt) * 0.12 * np.minimum(1, tt / 0.01) * np.minimum(1, (0.33 - tt) / 0.02))
    return np.concatenate(y).astype(np.float32)


def static(dur=2.5, rng=RNG):
    """Phone line hiss / dropout."""
    x = bp(white(dur, rng), 400, 3400) * 0.15
    t = np.arange(len(x)) / SR
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) ** 2
    return x.astype(np.float32)


def creak(rng=RNG):
    """Floorboard creak somewhere in the hallway."""
    dur = 0.9
    n = secs(dur)
    t = np.arange(n) / SR
    f = 180 + 70 * np.sin(2 * np.pi * 1.3 * t)
    c = bp(saw(f, dur), 200, 1600) * np.exp(-((t - 0.4) ** 2) / 0.05) * 0.18
    return c.astype(np.float32)


def knock(rng=RNG):
    """One slow knock on a wooden front door (heard from inside)."""
    dur = 0.7
    n = secs(dur)
    t = np.arange(n) / SR
    body = lp(white(dur, rng), 260, 4) * np.exp(-t / 0.05) * 2.0
    tone = np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.08) * 0.6
    return ((body + tone) * 0.5).astype(np.float32)
