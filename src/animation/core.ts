// Core animation helpers: keyframes with easing, organic noise, blinking,
// follow-through. Everything is a pure function of the frame number so
// renders are deterministic and every scene stays editable.
import {Easing} from 'remotion';

export type EaseFn = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  inOut: Easing.bezier(0.45, 0, 0.25, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.55, 0, 0.9, 0.4),
  // Slow-in/slow-out "camera" ease
  cam: Easing.bezier(0.6, 0, 0.2, 1),
  // Overshoot for anticipation/settle (follow-through)
  back: Easing.bezier(0.34, 1.45, 0.64, 1),
  // Small anticipation before the move
  anticip: Easing.bezier(0.5, -0.35, 0.3, 1),
  hold: () => 0,
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Keyframe = [frame, value, easing used to arrive at this key] */
export type Key = [number, number, EaseFn?];

export const kf = (frame: number, keys: Key[]): number => {
  if (keys.length === 0) return 0;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (frame <= f1) {
      const t = f1 === f0 ? 1 : (frame - f0) / (f1 - f0);
      return lerp(v0, v1, (e ?? ease.inOut)(clamp(t)));
    }
  }
  return keys[keys.length - 1][1];
};

/** Window helper: 0 before a, ramps to 1 between a and b. */
export const ramp = (frame: number, a: number, b: number, e: EaseFn = ease.inOut) =>
  e(invLerp(a, b, frame));

// ---------- deterministic noise ----------
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
export const rand = (seed: number) => hash(seed);

/** Smooth 1D value noise in [-1, 1]. */
export const noise = (t: number, seed = 0) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash(i + seed * 57.13);
  const b = hash(i + 1 + seed * 57.13);
  return lerp(a, b, smooth(f)) * 2 - 1;
};

/** Fractal noise – layered for organic micro motion. */
export const fbm = (t: number, seed = 0) =>
  noise(t, seed) * 0.6 + noise(t * 2.13, seed + 3.7) * 0.28 + noise(t * 4.7, seed + 9.1) * 0.12;

// ---------- character life ----------
/**
 * Natural blinking: irregular intervals (2–5 s), sometimes a double blink.
 * Returns eyelid closure 0..1. `extra` = explicit frames to force a blink.
 */
export const blink = (frame: number, seed = 1, fps = 30, extra: number[] = []): number => {
  const shape = (d: number) => {
    // close fast (3f), open slower (5f)
    if (d < 0 || d > 8) return 0;
    if (d < 3) return ease.in(d / 3);
    return 1 - ease.out((d - 3) / 5);
  };
  let v = 0;
  for (const e of extra) v = Math.max(v, shape(frame - e));
  // walk through pseudo-random schedule
  let t = Math.floor(rand(seed) * fps * 1.5);
  let k = 0;
  while (t <= frame + 1) {
    v = Math.max(v, shape(frame - t));
    if (rand(seed * 13 + k) < 0.18) v = Math.max(v, shape(frame - (t + 10)));
    t += Math.floor(fps * (2 + rand(seed * 7 + k) * 3));
    k++;
  }
  return v;
};

/** Breathing cycle 0..1 (≈ 4 s period, slightly irregular). */
export const breath = (frame: number, seed = 0, rate = 1) => {
  const t = (frame / 30) * rate * 0.25 * Math.PI * 2 + noise(frame / 90, seed) * 0.6;
  return (Math.sin(t) + 1) / 2;
};

/** Saccade-style gaze: holds, then quick moves. */
export const saccade = (frame: number, seed = 0, amp = 0.35, everySec = 1.6) => {
  const period = 30 * everySec;
  const i = Math.floor(frame / period);
  const f = (frame % period) / 4; // 4-frame eye move
  const p0 = (rand(i + seed * 31) * 2 - 1) * amp;
  const p1 = (rand(i + 1 + seed * 31) * 2 - 1) * amp;
  const prev = (rand(i - 1 + seed * 31) * 2 - 1) * amp;
  void p1;
  return lerp(prev, p0, ease.out(clamp(f)));
};

/** Damped follow-through: lagged echo of a driver function. */
export const follow = (frame: number, driver: (f: number) => number, lag = 3, damp = 0.55) =>
  driver(frame - lag) * damp + driver(frame - lag * 2) * (1 - damp) * 0.6;

export const seconds = (s: number, fps = 30) => Math.round(s * fps);
