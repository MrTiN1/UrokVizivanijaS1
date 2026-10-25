// War-zone landscape kit: dusk sky with horizon glow, burnt tree belt
// ("посадка"), cratered ground. Procedural but deterministic (seeded).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {rand, noise} from '../../../animation/core';
import {P, smoothPath} from '../../../characters/geometry';

export const WarSky: React.FC<{horizon?: number; glow?: number; id?: string}> = ({horizon = 1150, glow = 1, id = 'ws'}) => {
  const frame = useCurrentFrame();
  const flick = 0.9 + 0.1 * noise(frame / 12, 4);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1118" />
          <stop offset="0.35" stopColor="#1b2230" />
          <stop offset={horizon / 1920 - 0.08} stopColor="#3a3438" />
          <stop offset={horizon / 1920} stopColor="#8a4a2a" />
          <stop offset={horizon / 1920 + 0.02} stopColor="#2a2220" />
          <stop offset="1" stopColor="#0d0e10" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.68" cy={horizon / 1920} r="0.55" gradientTransform="scale(1 0.5625)">
          <stop offset="0" stopColor="#ff9a4a" stopOpacity={0.85} />
          <stop offset="0.3" stopColor="#d2602a" stopOpacity={0.45} />
          <stop offset="1" stopColor="#5a2a1a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id}-sky)`} />
      <ellipse cx={720} cy={horizon} rx={900} ry={380} fill={`url(#${id}-glow)`} opacity={glow * flick} />
      {/* smoky cloud bands */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 260 + i * 150;
        const dx = (frame * (0.3 + i * 0.08)) % 400;
        const pts: P[] = [];
        for (let k = 0; k <= 10; k++) pts.push([-300 + k * 170 + dx, y + noise(k * 0.7, i) * 40]);
        for (let k = 10; k >= 0; k--) pts.push([-300 + k * 170 + dx, y + 70 + noise(k * 0.9, i + 9) * 50]);
        return <path key={i} d={smoothPath(pts, true)} fill={i < 2 ? '#0a0d12' : '#2b2627'} opacity={0.5 - i * 0.05} />;
      })}
    </svg>
  );
};

/** Distant flat tree line silhouette. */
export const FarTreeline: React.FC<{y: number; color?: string; seed?: number; height?: number}> = ({y, color = '#262a30', seed = 1, height = 70}) => {
  const pts: P[] = [[-100, y + 200]];
  for (let x = -100; x <= 1200; x += 14) {
    const h = height * (0.5 + 0.5 * rand(x * 0.13 + seed)) * (0.7 + 0.3 * noise(x / 120, seed));
    pts.push([x, y - h]);
  }
  pts.push([1200, y + 200]);
  return <path d={`M${pts.map((p) => p.join(' ')).join(' L')}Z`} fill={color} />;
};

type TreeSpec = {x: number; base: number; h: number; w: number; seed: number; lean?: number};

/** A burnt, broken tree: tapered trunk, jagged snapped top, bare branches. */
export const BrokenTree: React.FC<TreeSpec & {color?: string; rim?: string; rimSide?: number}> = ({
  x,
  base,
  h,
  w,
  seed,
  lean = 0,
  color = '#141519',
  rim = '#c46a35',
  rimSide = 1,
}) => {
  const top = base - h;
  const tw = w * 0.35;
  const lx = lean * h;
  // jagged break
  const jag: P[] = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    jag.push([x + lx - tw + t * tw * 2, top - rand(seed * 7 + i) * h * 0.08 * (i % 2 ? 1 : 0.3)]);
  }
  const trunk: P[] = [[x - w, base + 10], [x - w * 0.62 + lx * 0.4, base - h * 0.45], ...jag, [x + w * 0.62 + lx * 0.4, base - h * 0.45], [x + w, base + 10]];
  const branches: React.ReactNode[] = [];
  const nb = 2 + Math.floor(rand(seed * 3) * 4);
  for (let i = 0; i < nb; i++) {
    const t = 0.35 + rand(seed * 11 + i) * 0.5;
    const by = base - h * t;
    const bx = x + lx * t;
    const side = rand(seed * 5 + i) > 0.5 ? 1 : -1;
    const len = h * (0.12 + rand(seed + i * 9) * 0.22) * (1 - t * 0.4);
    const ang = (-35 - rand(seed * 2 + i) * 35) * (Math.PI / 180);
    const ex = bx + side * Math.cos(ang) * len;
    const ey = by + Math.sin(ang) * len;
    const bw = w * 0.32 * (1 - t * 0.5);
    branches.push(
      <path
        key={i}
        d={`M${bx - bw * 0.5} ${by + bw} L${ex} ${ey} L${bx + bw * 0.5} ${by - bw * 0.2}Z`}
        fill={color}
      />,
    );
    if (rand(seed * 13 + i) > 0.5) {
      const tx = ex + side * len * 0.35;
      const ty = ey - len * 0.25;
      branches.push(<path key={`t${i}`} d={`M${ex} ${ey} L${tx} ${ty}`} stroke={color} strokeWidth={Math.max(1.5, bw * 0.35)} strokeLinecap="round" />);
    }
  }
  const trunkD = smoothPath(trunk, true, 0.35);
  return (
    <g>
      {branches}
      <path d={trunkD} fill={color} />
      {/* rim light from the burning horizon */}
      <path
        d={`M${x + rimSide * w * 0.95} ${base} L${x + rimSide * w * 0.55 + lx * 0.4} ${base - h * 0.45} L${x + rimSide * tw * 0.9 + lx} ${top + 4}`}
        stroke={rim}
        strokeWidth={Math.max(1.5, w * 0.12)}
        fill="none"
        opacity={0.55}
        strokeLinecap="round"
      />
      {/* bark cracks */}
      <path d={`M${x - w * 0.1} ${base - h * 0.1} l${w * 0.15} ${-h * 0.2} l${-w * 0.1} ${-h * 0.15}`} stroke="#000" strokeOpacity={0.35} strokeWidth={2} fill="none" />
    </g>
  );
};

export const treeRow = (count: number, base: number, hMin: number, hMax: number, wMin: number, wMax: number, seed: number, xSpread = [-80, 1160]): TreeSpec[] =>
  Array.from({length: count}).map((_, i) => ({
    x: xSpread[0] + ((i + rand(seed * 17 + i) * 0.8) / count) * (xSpread[1] - xSpread[0]),
    base: base + rand(seed + i * 3) * 30,
    h: hMin + rand(seed * 5 + i) * (hMax - hMin),
    w: wMin + rand(seed * 7 + i) * (wMax - wMin),
    seed: seed * 100 + i,
    lean: (rand(seed * 19 + i) - 0.5) * 0.25,
  }));

export const Ground: React.FC<{y: number; color?: string; color2?: string; id?: string}> = ({y, color = '#1d1a17', color2 = '#0d0c0b', id = 'gr'}) => {
  const pts: P[] = [[-200, 2200]];
  for (let x = -200; x <= 1300; x += 60) pts.push([x, y + noise(x / 200, 3) * 18]);
  pts.push([1300, 2200]);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a3326" />
          <stop offset="0.04" stopColor={color} />
          <stop offset="1" stopColor={color2} />
        </linearGradient>
      </defs>
      <path d={smoothPath(pts, true, 0.6)} fill={`url(#${id}-g)`} />
      {/* craters */}
      {[
        [180, y + 140, 160],
        [820, y + 90, 120],
        [560, y + 330, 220],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.22} fill="#0a0908" opacity={0.8} />
          <path d={`M${cx - r * 1.05} ${cy} Q${cx} ${cy - r * 0.38} ${cx + r * 1.05} ${cy}`} stroke="#5a3a28" strokeWidth={5} fill="none" opacity={0.5} />
        </g>
      ))}
      {/* dry grass tufts */}
      {Array.from({length: 40}).map((_, i) => {
        const gx = rand(i * 3.3) * 1080;
        const gy = y + 20 + rand(i * 5.1) * 500;
        const s = 0.6 + (gy - y) / 400;
        return (
          <path
            key={i}
            d={`M${gx} ${gy} l${-6 * s} ${-22 * s} M${gx} ${gy} l${2 * s} ${-28 * s} M${gx} ${gy} l${9 * s} ${-18 * s}`}
            stroke="#3d3123"
            strokeWidth={2 * s}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export const TreeLayer: React.FC<{trees: TreeSpec[]; color?: string; rim?: string; rimSide?: number}> = ({trees, color, rim, rimSide}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {trees.map((t) => (
      <BrokenTree key={t.seed} {...t} color={color} rim={rim} rimSide={rimSide} />
    ))}
  </svg>
);
