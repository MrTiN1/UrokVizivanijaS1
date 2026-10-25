// Night weather & light: rain streaks, ground splashes, drops on glass,
// wet-asphalt reflections, glow halos, volumetric light cones, flicker.
// All deterministic per frame (seeded noise) so renders are repeatable.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fbm, noise, rand} from '../animation/core';

/** Flicker intensity 0.2..1: random stutter inside [a,b] windows (seconds), steady 1 outside. */
export const flicker = (t: number, windows: number[][] = [], seed = 1, base = 1) => {
  let v = base;
  for (const [a, b] of windows) {
    if (t >= a && t <= b) {
      const k = Math.floor(t * 24);
      const r = rand(k * 3.7 + seed * 11);
      v = r < 0.45 ? 0.18 + r * 0.4 : r < 0.7 ? 0.55 : 1;
    }
  }
  // tiny constant buzz of old fluorescent tubes
  return v * (0.97 + 0.03 * Math.sin(t * 2 * Math.PI * 50 * 0.37 + seed));
};

type RainProps = {
  count?: number;
  seed?: number;
  angle?: number; // deg from vertical (+ = falls to the right)
  speed?: number; // px per frame
  length?: number;
  width?: number;
  color?: string;
  opacity?: number;
  area?: [number, number, number, number];
  blur?: number;
  t?: number; // override time (frames), e.g. for moving cameras
};

/** One depth layer of falling rain streaks. Stack 2–3 layers for depth. */
export const Rain: React.FC<RainProps> = ({
  count = 140,
  seed = 1,
  angle = 8,
  speed = 46,
  length = 70,
  width = 1.6,
  color = '#c8d6ea',
  opacity = 0.35,
  area = [-200, -200, 1480, 2320],
  blur = 0,
  t,
}) => {
  const cur = useCurrentFrame();
  const frame = t ?? cur;
  const [x0, y0, w, h] = area;
  const a = (angle * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const id = `rain${seed}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', filter: blur ? `blur(${blur}px)` : undefined}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={dx} y2={dy}>
          <stop offset="0" stopColor={color} stopOpacity={0} />
          <stop offset="1" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      {Array.from({length: count}).map((_, i) => {
        const sp = speed * (0.75 + rand(i * 2.1 + seed) * 0.5);
        const L = length * (0.6 + rand(i * 5.3 + seed) * 0.8);
        const travel = (frame * sp + rand(i * 7.7 + seed) * h) % h;
        const x = x0 + ((rand(i * 3.3 + seed) * w + travel * dx) % w);
        const y = y0 + travel * dy;
        return (
          <line
            key={i}
            x1={x - dx * L}
            y1={y - dy * L}
            x2={x}
            y2={y}
            stroke={color}
            strokeWidth={width * (0.6 + rand(i * 9.1 + seed) * 0.8)}
            strokeLinecap="round"
            opacity={opacity * (0.5 + rand(i * 4.4 + seed) * 0.5)}
          />
        );
      })}
    </svg>
  );
};

/** Little crown splashes on a ground band (y range), perspective-scaled. */
export const Splashes: React.FC<{count?: number; seed?: number; y0?: number; y1?: number; color?: string; opacity?: number; x0?: number; x1?: number}> = ({
  count = 40,
  seed = 3,
  y0 = 1500,
  y1 = 1920,
  color = '#d9e4f2',
  opacity = 0.5,
  x0 = 0,
  x1 = 1080,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: count}).map((_, i) => {
        const life = 9 + Math.floor(rand(i * 2 + seed) * 6);
        const off = Math.floor(rand(i * 5 + seed) * 200);
        const cyc = Math.floor((frame + off) / life);
        const p = ((frame + off) % life) / life;
        const x = x0 + rand(cyc * 13.1 + i * 7 + seed) * (x1 - x0);
        const y = y0 + rand(cyc * 3.9 + i * 11 + seed) * (y1 - y0);
        const s = 0.4 + ((y - y0) / Math.max(1, y1 - y0)) * 1.0;
        const r = (4 + p * 16) * s;
        return (
          <g key={i} opacity={opacity * (1 - p)}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.28} fill="none" stroke={color} strokeWidth={1.4 * s} />
            {p < 0.5 ? <line x1={x - 3 * s} y1={y - 2} x2={x - 6 * s} y2={y - 12 * s * (1 - p * 2)} stroke={color} strokeWidth={1.2 * s} /> : null}
            {p < 0.5 ? <line x1={x + 3 * s} y1={y - 2} x2={x + 7 * s} y2={y - 10 * s * (1 - p * 2)} stroke={color} strokeWidth={1.2 * s} /> : null}
          </g>
        );
      })}
    </svg>
  );
};

/** Water drops on a window: static beads + drops that slide down leaving a trail. Draw inside a clipped window. */
export const RainOnGlass: React.FC<{w: number; h: number; seed?: number; density?: number; tint?: string; light?: string}> = ({
  w,
  h,
  seed = 5,
  density = 1,
  tint = '#9fb4cc',
  light = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const beads = Math.round(90 * density * (w * h) / (1080 * 1920) * 3);
  const sliders = Math.round(10 * density * w / 1080 * 2);
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: beads}).map((_, i) => {
        const x = rand(i * 1.7 + seed) * w;
        const y = rand(i * 2.9 + seed) * h;
        const r = 1.5 + rand(i * 4.3 + seed) ** 3 * 7;
        return (
          <g key={`b${i}`}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 1.1} fill={tint} opacity={0.22} />
            <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.35} ry={r * 0.3} fill={light} opacity={0.45} />
          </g>
        );
      })}
      {Array.from({length: sliders}).map((_, i) => {
        const period = 70 + rand(i * 3 + seed) * 120;
        const off = rand(i * 9 + seed) * period;
        const cyc = Math.floor((frame + off) / period);
        const p = ((frame + off) % period) / period;
        const x = rand(i * 7 + cyc * 5.1 + seed) * w + noise(p * 6, i) * 8;
        const yHead = -20 + p ** 1.6 * (h + 60);
        const r = 3 + rand(i * 5 + seed) * 3;
        return (
          <g key={`s${i}`}>
            <path d={`M${x} ${Math.max(-20, yHead - 160 * p - 40)} Q${x + noise(p * 3, i + 4) * 6} ${yHead - 40} ${x} ${yHead}`} stroke={tint} strokeWidth={r * 0.7} opacity={0.18} fill="none" strokeLinecap="round" />
            <ellipse cx={x} cy={yHead} rx={r} ry={r * 1.25} fill={tint} opacity={0.35} />
            <ellipse cx={x - r * 0.3} cy={yHead - r * 0.4} rx={r * 0.35} ry={r * 0.3} fill={light} opacity={0.6} />
          </g>
        );
      })}
    </svg>
  );
};

export type LightSrc = {x: number; y: number; color: string; size?: number; intensity?: number};

/**
 * Wet-asphalt reflections: every light source above the ground line gets a
 * long vertical, rippling smear mirrored below `ground` (the y of the road).
 */
export const WetReflections: React.FC<{lights: LightSrc[]; ground: number; depth?: number; seed?: number; opacity?: number}> = ({lights, ground, depth = 520, seed = 2, opacity = 0.6}) => {
  const frame = useCurrentFrame();
  const id = `wr${seed}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <defs>
        <filter id={id} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="9 18" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {lights.map((l, i) => {
          const s = l.size ?? 30;
          const k = l.intensity ?? 1;
          const mirrorY = ground + (ground - l.y) * 0.35;
          const len = Math.min(depth, 1920 - mirrorY + 100);
          const segs = 7;
          return (
            <g key={i} opacity={opacity * k}>
              {Array.from({length: segs}).map((_, j) => {
                const yy = mirrorY + (j / segs) * len;
                const wob = noise(frame / 9 + j * 1.3 + i, seed + j) * (6 + j * 2);
                const ww = s * (0.8 + j * 0.12);
                return <ellipse key={j} cx={l.x + wob} cy={yy} rx={ww * 0.55} ry={len / segs * 0.75} fill={l.color} opacity={(1 - j / segs) * 0.9} />;
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** Soft round glow (street lamp bulb, headlight, window). */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; intensity?: number; core?: string}> = ({x, y, r, color, intensity = 1, core}) => {
  const id = `gl${Math.round(x)}_${Math.round(y)}_${Math.round(r)}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', overflow: 'visible'}}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={core ?? color} stopOpacity={0.95 * intensity} />
          <stop offset="0.18" stopColor={color} stopOpacity={0.55 * intensity} />
          <stop offset="0.5" stopColor={color} stopOpacity={0.16 * intensity} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </svg>
  );
};

/** Volumetric cone of light from a lamp (top point) widening downwards, with rain glinting in it. */
export const LightCone: React.FC<{x: number; y: number; w0?: number; w1: number; h: number; color?: string; intensity?: number; seed?: number; rain?: boolean}> = ({
  x,
  y,
  w0 = 20,
  w1,
  h,
  color = '#ffc777',
  intensity = 1,
  seed = 1,
  rain = true,
}) => {
  const frame = useCurrentFrame();
  const id = `cone${seed}`;
  const breathe = 0.85 + 0.15 * fbm(frame / 40, seed);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.55 * intensity * breathe} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.16 * intensity * breathe} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}b`}>
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <clipPath id={`${id}c`}>
          <polygon points={`${x - w0 / 2},${y} ${x + w0 / 2},${y} ${x + w1 / 2},${y + h} ${x - w1 / 2},${y + h}`} />
        </clipPath>
      </defs>
      <polygon points={`${x - w0 / 2},${y} ${x + w0 / 2},${y} ${x + w1 / 2},${y + h} ${x - w1 / 2},${y + h}`} fill={`url(#${id})`} filter={`url(#${id}b)`} />
      {rain ? (
        <g clipPath={`url(#${id}c)`} opacity={0.9 * intensity}>
          {Array.from({length: 46}).map((_, i) => {
            const sp = 40 + rand(i * 3 + seed) * 20;
            const yy = y + ((frame * sp + rand(i * 7 + seed) * h) % h);
            const xx = x - w1 / 2 + rand(i * 5 + seed) * w1 + (yy - y) * 0.12;
            return <line key={i} x1={xx - 5} y1={yy - 46} x2={xx} y2={yy} stroke="#fff2d8" strokeWidth={1.8} opacity={0.35 + 0.4 * rand(i)} strokeLinecap="round" />;
          })}
        </g>
      ) : null}
    </svg>
  );
};

/** Low drifting mist bands (colored), several layers. */
export const Mist: React.FC<{y: number; height?: number; color?: string; opacity?: number; seed?: number; speed?: number}> = ({y, height = 420, color = '120,140,170', opacity = 0.25, seed = 1, speed = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {[0, 1, 2].map((i) => {
        const dx = ((frame * (0.5 + i * 0.3) * speed + rand(i + seed) * 800) % 1600) - 400;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: dx - 600,
              top: y - height / 2 + i * height * 0.25 + Math.sin(frame / 80 + i) * 12,
              width: 1800,
              height,
              background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${color},${opacity}) 0%, rgba(${color},${opacity * 0.5}) 45%, rgba(${color},0) 75%)`,
              filter: 'blur(10px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
