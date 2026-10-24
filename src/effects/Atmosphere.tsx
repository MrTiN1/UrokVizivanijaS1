// Atmospheric effects: grain, vignette, grade, dust, smoke, fog, embers,
// light rays, flashes. All deterministic per frame.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {fbm, noise, rand} from '../animation/core';

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const i = frame % 4;
  const ox = Math.floor(rand(frame * 3.1) * 400);
  const oy = Math.floor(rand(frame * 7.7) * 400);
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity, pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: -540,
          backgroundImage: `url(${staticFile(`textures/grain_${i}.png`)})`,
          backgroundSize: '540px 540px',
          transform: `translate(${ox}px, ${oy}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.55, color = '0,0,0'}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 60% at 50% 46%, rgba(${color},0) 45%, rgba(${color},${strength * 0.6}) 78%, rgba(${color},${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Colour grade overlay: tint in multiply + highlight lift in screen. */
export const Grade: React.FC<{shadow?: string; highlight?: string; shadowOp?: number; highlightOp?: number}> = ({
  shadow = '#1c2a3a',
  highlight = '#ffcf8a',
  shadowOp = 0.25,
  highlightOp = 0.08,
}) => (
  <>
    <AbsoluteFill style={{background: shadow, mixBlendMode: 'soft-light', opacity: shadowOp}} />
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${highlight} 0%, transparent 70%)`, mixBlendMode: 'screen', opacity: highlightOp}} />
  </>
);

export const Dust: React.FC<{count?: number; color?: string; area?: [number, number, number, number]; seed?: number; size?: number; speed?: number; opacity?: number}> = ({
  count = 40,
  color = '#fff3d6',
  area = [0, 0, 1080, 1920],
  seed = 1,
  size = 3,
  speed = 1,
  opacity = 0.6,
}) => {
  const frame = useCurrentFrame();
  const [x0, y0, w, h] = area;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id={`dust${seed}`}>
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({length: count}).map((_, i) => {
        const r = size * (0.4 + rand(i * 3.3 + seed) * 1.2);
        const t = frame / 30;
        const x = x0 + ((rand(i + seed * 9) * w + noise(t * 0.25 * speed, i + seed) * 60 + t * 6 * speed) % w);
        const y = y0 + ((rand(i * 7 + seed) * h - t * 9 * speed * (0.5 + rand(i)) + h * 10) % h);
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + rand(i * 5)) * 2 + i);
        return <circle key={i} cx={x} cy={y} r={r * 2} fill={`url(#dust${seed})`} opacity={opacity * tw} />;
      })}
    </svg>
  );
};

export const Embers: React.FC<{count?: number; seed?: number; opacity?: number}> = ({count = 26, seed = 3, opacity = 1}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id="ember">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset="0.35" stopColor="#ffab3d" />
          <stop offset="1" stopColor="#ff5a1f" stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({length: count}).map((_, i) => {
        const life = 90 + rand(i * 4 + seed) * 90;
        const t0 = rand(i * 11 + seed) * life;
        const p = ((frame + t0) % life) / life;
        const x = rand(i * 2 + seed) * 1080 + noise((frame + i * 40) / 40, i) * 80 + p * 120;
        const y = 1700 - p * (1100 + rand(i) * 600);
        const s = 2 + rand(i * 6) * 4;
        const a = Math.sin(p * Math.PI) * (0.6 + 0.4 * Math.sin(frame * 0.5 + i));
        return <circle key={i} cx={x} cy={y} r={s * 2.4} fill="url(#ember)" opacity={a * opacity} />;
      })}
    </svg>
  );
};

/** Big soft smoke blobs drifting horizontally. */
export const Smoke: React.FC<{color?: string; y?: number; spread?: number; count?: number; opacity?: number; seed?: number; speed?: number; size?: number}> = ({
  color = '#3b3f45',
  y = 1100,
  spread = 500,
  count = 9,
  opacity = 0.5,
  seed = 2,
  speed = 1,
  size = 340,
}) => {
  const frame = useCurrentFrame();
  const id = `smk${seed}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={0.9} />
          <stop offset="0.5" stopColor={color} stopOpacity={0.45} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({length: count}).map((_, i) => {
        const t = frame / 30;
        const r = size * (0.6 + rand(i * 5 + seed) * 0.9) * (1 + t * 0.02);
        const x = ((rand(i * 13 + seed) * 1600 + t * 22 * speed * (0.6 + rand(i))) % 1700) - 300;
        const yy = y + (rand(i * 3 + seed) - 0.5) * spread - t * 6 * speed + fbm(t * 0.2, i) * 30;
        return <ellipse key={i} cx={x} cy={yy} rx={r} ry={r * 0.6} fill={`url(#${id})`} opacity={opacity * (0.6 + 0.4 * rand(i * 9))} />;
      })}
    </svg>
  );
};

export const Fog: React.FC<{y?: number; height?: number; color?: string; opacity?: number}> = ({y = 1200, height = 500, color = '180,190,200', opacity = 0.35}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 30;
  return (
    <AbsoluteFill
      style={{
        top: y - height / 2 + drift * 0.3,
        height,
        background: `linear-gradient(180deg, rgba(${color},0) 0%, rgba(${color},${opacity}) 50%, rgba(${color},0) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Volumetric light shafts (god rays). */
export const LightRays: React.FC<{
  origin: [number, number];
  angle: number; // deg direction of rays
  count?: number;
  length?: number;
  spread?: number;
  color?: string;
  opacity?: number;
  seed?: number;
}> = ({origin, angle, count = 5, length = 1800, spread = 26, color = '#ffe2a8', opacity = 0.3, seed = 1}) => {
  const frame = useCurrentFrame();
  const id = `ray${seed}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0.9} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}b`}>
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <g filter={`url(#${id}b)`} transform={`translate(${origin[0]} ${origin[1]}) rotate(${angle})`}>
        {Array.from({length: count}).map((_, i) => {
          const a = (i / Math.max(1, count - 1) - 0.5) * spread;
          const w = 40 + rand(i * 7 + seed) * 90;
          const fl = 0.65 + 0.35 * Math.sin(frame / (40 + i * 7) + i * 2);
          return (
            <polygon
              key={i}
              points={`0,${-w * 0.2} ${length},${-w * 1.8} ${length},${w * 1.8} 0,${w * 0.2}`}
              fill={`url(#${id})`}
              opacity={opacity * fl}
              transform={`rotate(${a})`}
            />
          );
        })}
      </g>
    </svg>
  );
};

export const Flash: React.FC<{amount: number; color?: string}> = ({amount, color = '#fff'}) =>
  amount > 0.001 ? <AbsoluteFill style={{background: color, opacity: amount, pointerEvents: 'none'}} /> : null;

export const Black: React.FC<{amount: number}> = ({amount}) =>
  amount > 0.001 ? <AbsoluteFill style={{background: '#000', opacity: amount, pointerEvents: 'none'}} /> : null;

export const Texture: React.FC<{opacity?: number}> = ({opacity = 0.06}) => (
  <AbsoluteFill style={{mixBlendMode: 'soft-light', opacity, pointerEvents: 'none'}}>
    <Img src={staticFile('textures/paint_noise.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </AbsoluteFill>
);
