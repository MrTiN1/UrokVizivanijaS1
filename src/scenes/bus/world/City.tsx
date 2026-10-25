// Night city kit: sky, building blocks with lit windows, street lamps,
// wet road and sidewalk. Palette: deep blue, grey-green, muted violet,
// warm sodium lamps. Reused by the college, bus-stop and window shots.
import React from 'react';
import {rand} from '../../../animation/core';

export const PAL = {
  sky0: '#070b16',
  sky1: '#141c33',
  sky2: '#2a2442',
  bld: '#121826',
  bldFar: '#1b2236',
  bldNear: '#0b0f18',
  greenGrey: '#2c3b38',
  violet: '#3a2f52',
  warm: '#ffc46b',
  warmDeep: '#ff9d3c',
  cold: '#dfe9f4',
  coldBlue: '#9fc4ff',
  asphalt: '#0e121b',
  asphaltWet: '#1a2131',
  curb: '#2a313d',
};

export const NightSky: React.FC<{horizon?: number; id?: string; glow?: string}> = ({horizon = 1000, id = 'nsky', glow = '#3a2f52'}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={PAL.sky0} />
        <stop offset={String(horizon / 1920 * 0.6)} stopColor={PAL.sky1} />
        <stop offset={String(horizon / 1920)} stopColor={glow} />
        <stop offset="1" stopColor={PAL.asphalt} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill={`url(#${id})`} />
  </svg>
);

type Bld = {x: number; w: number; h: number; seed: number};
export const blocks = (seed: number, n: number, x0: number, x1: number, hMin: number, hMax: number): Bld[] => {
  const out: Bld[] = [];
  let x = x0;
  for (let i = 0; x < x1 && i < n * 3; i++) {
    const w = 90 + rand(seed * 7 + i * 3.1) * 170;
    out.push({x, w, h: hMin + rand(seed * 3 + i * 5.7) * (hMax - hMin), seed: seed * 100 + i});
    x += w + rand(seed + i) * 14;
  }
  return out;
};

/**
 * Row of buildings standing on `base` with a grid of warm/cold windows.
 * Windows are merged into one <path> per colour and memoised: thousands of
 * rects as separate nodes made every frame slow to render.
 */
export const BuildingRow: React.FC<{base: number; blds: Bld[]; color?: string; lit?: number; winScale?: number; haze?: number}> = ({base, blds, color = PAL.bld, lit = 0.35, winScale = 1, haze = 0}) => {
  const key = `${base}|${color}|${lit}|${winScale}|${blds.map((b) => `${b.seed}:${Math.round(b.x)}:${Math.round(b.w)}:${Math.round(b.h)}`).join(',')}`;
  const svg = React.useMemo(() => {
    const groups: Record<string, string[]> = {'#ffd38a': [], '#e7a85a': [], '#a9c7e8': []};
    const bodies: string[] = [];
    const tops: string[] = [];
    for (const b of blds) {
      const top = base - b.h;
      bodies.push(`M${b.x} ${top}h${b.w}v${b.h + 400}h${-b.w}Z`);
      tops.push(`M${b.x} ${top}h${b.w}v6h${-b.w}Z`);
      const cw = 22 * winScale;
      const ch = 30 * winScale;
      const cols = Math.max(1, Math.floor((b.w - 20) / (cw * 1.7)));
      const rows = Math.max(1, Math.floor((b.h - 30) / (ch * 1.6)));
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const k = rand(b.seed * 13 + r * 7.3 + c * 3.1);
          if (k > lit) continue;
          const warm = rand(b.seed * 5 + r + c * 9) > 0.25;
          const col = warm ? (k < lit * 0.4 ? '#ffd38a' : '#e7a85a') : '#a9c7e8';
          const x = b.x + 12 + c * cw * 1.7;
          const y = top + 22 + r * ch * 1.6;
          groups[col].push(`M${x.toFixed(1)} ${y.toFixed(1)}h${cw.toFixed(1)}v${ch.toFixed(1)}h${(-cw).toFixed(1)}Z`);
        }
    }
    return (
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={bodies.join('')} fill={color} />
        <path d={tops.join('')} fill="#ffffff" opacity={0.04} />
        {Object.entries(groups).map(([col, ds]) => (ds.length ? <path key={col} d={ds.join('')} fill={col} opacity={col === '#ffd38a' ? 0.95 : 0.8} /> : null))}
        {haze > 0 ? <rect x={-500} y={base - 900} width={2100} height={900} fill="#2a2442" opacity={haze} /> : null}
      </svg>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, haze]);
  return svg;
};

/** Street lamp; returns nothing but the drawing — the glow/cone are added by the scene (needs flicker). */
export const StreetLamp: React.FC<{x: number; base: number; h?: number; dir?: number; scale?: number; on?: number}> = ({x, base, h = 760, dir = 1, scale = 1, on = 1}) => {
  const top = base - h * scale;
  const armX = x + dir * 120 * scale;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <rect x={x - 7 * scale} y={top} width={14 * scale} height={h * scale} fill="#1a1f29" />
      <rect x={x - 12 * scale} y={base - 60 * scale} width={24 * scale} height={60 * scale} fill="#151922" />
      <path d={`M${x} ${top + 10 * scale} Q${x + dir * 40 * scale} ${top - 30 * scale} ${armX} ${top - 10 * scale}`} stroke="#1a1f29" strokeWidth={9 * scale} fill="none" />
      <path d={`M${armX - 34 * scale} ${top - 14 * scale} L${armX + 34 * scale} ${top - 14 * scale} L${armX + 22 * scale} ${top + 6 * scale} L${armX - 22 * scale} ${top + 6 * scale}Z`} fill="#202633" />
      <ellipse cx={armX} cy={top + 6 * scale} rx={22 * scale} ry={6 * scale} fill={`rgba(255,214,150,${0.25 + 0.75 * on})`} />
    </svg>
  );
};
export const lampHead = (x: number, base: number, h = 760, dir = 1, scale = 1) => ({x: x + dir * 120 * scale, y: base - h * scale + 8 * scale});

/** Wet road + sidewalk band in simple perspective (horizon at `top`). */
export const WetStreet: React.FC<{top: number; curb?: number; id?: string; lane?: boolean}> = ({top, curb, id = 'wst', lane = true}) => {
  const c = curb ?? top + 260;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2335" />
          <stop offset="0.5" stopColor={PAL.asphaltWet} />
          <stop offset="1" stopColor={PAL.asphalt} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#222937" />
          <stop offset="1" stopColor="#10141c" />
        </linearGradient>
      </defs>
      <rect x={0} y={top} width={1080} height={c - top} fill={`url(#${id})`} />
      {lane
        ? Array.from({length: 7}).map((_, i) => {
            const t0 = i / 7;
            const y = top + (c - top) * (0.35 + 0.5 * t0);
            return <rect key={i} x={-200 + i * 220} y={y} width={120} height={4 + t0 * 3} fill="#c8c3b4" opacity={0.25} />;
          })
        : null}
      <rect x={0} y={c} width={1080} height={22} fill={PAL.curb} />
      <rect x={0} y={c + 22} width={1080} height={1920 - c} fill={`url(#${id}s)`} />
      {/* paving joints */}
      {Array.from({length: 9}).map((_, i) => (
        <line key={i} x1={i * 140 - 40} y1={c + 22} x2={i * 180 - 400} y2={1920} stroke="#000" strokeOpacity={0.25} strokeWidth={2} />
      ))}
      {Array.from({length: 6}).map((_, i) => {
        const y = c + 22 + (1920 - c) * ((i + 1) / 7) ** 1.5;
        return <line key={`h${i}`} x1={0} y1={y} x2={1080} y2={y} stroke="#000" strokeOpacity={0.2} strokeWidth={2} />;
      })}
      {/* puddles: darker mirror patches */}
      {[[200, c + 180, 170], [760, c + 320, 220], [430, c + 520, 260]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.18} fill="#2a3450" opacity={0.45} />
      ))}
    </svg>
  );
};
