// The old city bus, inside and out.
//  - Interior in one-point perspective (camera in the aisle), facing the
//    front (driver cabin, windshield) or the rear (rear window, seat fronts).
//    `bp(X, Y, z)` maps bus space → screen so scenes can seat characters.
//  - Exterior: 3/4 front (route display «13», headlights) and side (doors).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {fbm, noise, rand} from '../../../animation/core';
import {PAL} from './City';

// ---------------- interior geometry ----------------
export const VP = {x: 540, y: 760};
/** X: -1 left wall … 1 right wall; Y: 0 floor … 1 ceiling; z: depth (1 = near). */
export const bp = (X: number, Y: number, z: number, vp = VP) => ({x: vp.x + (X * 900) / z, y: vp.y + ((0.55 - Y) * 1500) / z});
/** Character scale for a person standing/sitting at depth z. */
export const personScale = (z: number) => 1.3 / z;

const quad = (a: {x: number; y: number}, b: {x: number; y: number}, c: {x: number; y: number}, d: {x: number; y: number}) =>
  `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y} L${d.x} ${d.y}Z`;

export type InteriorProps = {
  facing: 'front' | 'rear';
  light?: number; // tube brightness (flicker) 0..1
  speed?: number; // outside streaks speed (0 = parked)
  zFar?: number;
  driverEmpty?: boolean;
  vp?: {x: number; y: number};
};

/** Bus shell: floor, ceiling with tube lamps, side walls with windows, far wall. */
export const BusInterior: React.FC<InteriorProps> = ({facing, light = 1, speed = 1, zFar = 8, vp = VP}) => {
  const frame = useCurrentFrame();
  const P = (X: number, Y: number, z: number) => bp(X, Y, z, vp);
  const zN = 0.5;
  const L = light;
  const wallCol = `rgb(${Math.round(26 + 40 * L)},${Math.round(34 + 46 * L)},${Math.round(42 + 52 * L)})`;
  const ceilCol = `rgb(${Math.round(40 + 92 * L)},${Math.round(48 + 100 * L)},${Math.round(56 + 106 * L)})`;
  const floorCol = `rgb(${Math.round(20 + 26 * L)},${Math.round(24 + 28 * L)},${Math.round(30 + 32 * L)})`;
  const winZs: [number, number][] = [];
  for (let z = 1.0; z < zFar - 0.5; z += 0.9) winZs.push([z + 0.08, z + 0.82]);
  // outside lights streaking past the windows (moving bus)
  const streaks = Array.from({length: 10}).map((_, i) => {
    const period = 50 + rand(i * 3.1) * 40;
    const p = (((frame * speed) / period + rand(i * 7.7)) % 1 + 1) % 1;
    const z = facing === 'front' ? zFar - p * (zFar - 0.9) : 0.9 + p * (zFar - 0.9);
    const side = rand(i * 5.3) > 0.5 ? 1 : -1;
    const Y = 0.5 + rand(i * 2.2) * 0.3;
    const warm = rand(i * 9.1) > 0.35;
    return {z, side, Y, warm, i};
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="bi-floor" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={floorCol} />
          <stop offset="1" stopColor="#0c0f14" />
        </linearGradient>
        <linearGradient id="bi-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060912" />
          <stop offset="1" stopColor="#141a2c" />
        </linearGradient>
        <filter id="bi-blur">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* far wall */}
      <rect x={P(-1, 1, zFar).x} y={P(-1, 1, zFar).y} width={P(1, 0, zFar).x - P(-1, 1, zFar).x} height={P(1, 0, zFar).y - P(-1, 1, zFar).y} fill={wallCol} />
      {/* ceiling */}
      <path d={quad(P(-1, 1, zN), P(1, 1, zN), P(1, 1, zFar), P(-1, 1, zFar))} fill={ceilCol} />
      {/* floor */}
      <path d={quad(P(-1, 0, zN), P(1, 0, zN), P(1, 0, zFar), P(-1, 0, zFar))} fill="url(#bi-floor)" />
      {/* aisle rubber strip */}
      <path d={quad(P(-0.18, 0, zN), P(0.18, 0, zN), P(0.18, 0, zFar), P(-0.18, 0, zFar))} fill="#0b0d11" opacity={0.5} />
      {Array.from({length: 14}).map((_, i) => {
        const z = zN + i * 0.5;
        if (z > zFar) return null;
        return <path key={i} d={`M${P(-0.18, 0, z).x} ${P(-0.18, 0, z).y} L${P(0.18, 0, z).x} ${P(0.18, 0, z).y}`} stroke="#000" strokeOpacity={0.3} strokeWidth={3 / z} />;
      })}
      {/* side walls */}
      {[-1, 1].map((s) => (
        <path key={s} d={quad(P(s, 0, zN), P(s, 1, zN), P(s, 1, zFar), P(s, 0, zFar))} fill={wallCol} />
      ))}
      {/* windows + outside */}
      {[-1, 1].map((s) =>
        winZs.map(([z0, z1], i) => (
          <g key={`${s}-${i}`}>
            <path d={quad(P(s, 0.42, z0), P(s, 0.88, z0), P(s, 0.88, z1), P(s, 0.42, z1))} fill="url(#bi-win)" />
            <path d={quad(P(s, 0.42, z0), P(s, 0.88, z0), P(s, 0.88, z1), P(s, 0.42, z1))} fill="none" stroke="#1c222c" strokeWidth={14 / z0} />
          </g>
        )),
      )}
      <g>
        {streaks.map((st) => {
          const a = P(st.side * 0.995, st.Y, st.z);
          const b = P(st.side * 0.995, st.Y, st.z + 0.5);
          const inWin = winZs.some(([z0, z1]) => st.z > z0 && st.z < z1);
          if (!inWin || speed === 0) return null;
          return <line key={st.i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={st.warm ? PAL.warm : PAL.coldBlue} strokeWidth={30 / st.z} opacity={0.4} strokeLinecap="round" />;
        })}
      </g>
      {/* window sills */}
      {[-1, 1].map((s) => (
        <path key={`sill${s}`} d={`M${P(s, 0.42, zN).x} ${P(s, 0.42, zN).y} L${P(s, 0.42, zFar).x} ${P(s, 0.42, zFar).y}`} stroke="#3c4550" strokeWidth={10} />
      ))}
      {/* ceiling tube lamps */}
      {Array.from({length: 6}).map((_, i) => {
        const z = 1.2 + i * 1.1;
        if (z > zFar - 0.3) return null;
        const c = quad(P(-0.22, 0.995, z), P(0.22, 0.995, z), P(0.22, 0.995, z + 0.55), P(-0.22, 0.995, z + 0.55));
        return (
          <g key={`lamp${i}`}>
            <path d={c} fill={`rgba(236,246,255,${0.25 + 0.75 * L})`} />
            <path d={c} fill="none" stroke="#b9c6cf" strokeWidth={4 / z} />
          </g>
        );
      })}
      {/* lamp bloom + their reflections on the polished floor */}
      <defs>
        <radialGradient id="bi-bloom">
          <stop offset="0" stopColor="#e6f1ff" stopOpacity={1} />
          <stop offset="1" stopColor="#e6f1ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g>
        {Array.from({length: 6}).map((_, i) => {
          const z = 1.2 + i * 1.1;
          if (z > zFar - 0.3) return null;
          const c = P(0, 0.99, z + 0.27);
          const fl = P(0, 0, z + 0.27);
          return (
            <g key={`bloom${i}`}>
              <ellipse cx={c.x} cy={c.y + 30 / z} rx={360 / z} ry={120 / z} fill="url(#bi-bloom)" opacity={0.3 * L} />
              <ellipse cx={fl.x} cy={fl.y} rx={300 / z} ry={70 / z} fill="url(#bi-bloom)" opacity={0.16 * L} />
            </g>
          );
        })}
      </g>
      {/* hand rails along the ceiling */}
      {[-0.34, 0.34].map((X) => (
        <path key={`rail${X}`} d={`M${P(X, 0.9, zN).x} ${P(X, 0.9, zN).y} L${P(X, 0.9, zFar).x} ${P(X, 0.9, zFar).y}`} stroke="#c7a33f" strokeWidth={9} opacity={0.8} />
      ))}
      {/* ad strip above windows (blank route map, no brands) */}
      {[-1, 1].map((s) => (
        <path key={`strip${s}`} d={quad(P(s, 0.9, zN), P(s, 0.99, zN), P(s, 0.99, zFar), P(s, 0.9, zFar))} fill="#2a3340" />
      ))}
      {/* light spill on floor */}
      <path d={quad(P(-0.5, 0, zN), P(0.5, 0, zN), P(0.3, 0, zFar), P(-0.3, 0, zFar))} fill="#e8f2ff" opacity={0.05 + 0.08 * L} />
    </svg>
  );
};

/** Far end of the bus when facing front: cabin partition, windshield, road, driver seat. */
export const FrontEnd: React.FC<{z: number; light?: number; driver?: React.ReactNode; wipers?: boolean; vp?: {x: number; y: number}}> = ({z, light = 1, driver, wipers = true, vp = VP}) => {
  const frame = useCurrentFrame();
  const P = (X: number, Y: number, zz: number) => bp(X, Y, zz, vp);
  const tl = P(-1, 0.95, z);
  const br = P(1, 0.42, z);
  const w = br.x - tl.x;
  const h = br.y - tl.y;
  const wip = Math.sin(frame / 14) * 0.5 + 0.5;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="fe-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0f1c" />
          <stop offset="0.55" stopColor="#1a2238" />
          <stop offset="1" stopColor="#2a2a3a" />
        </linearGradient>
        <clipPath id="fe-ws">
          <rect x={tl.x + w * 0.04} y={tl.y + h * 0.06} width={w * 0.92} height={h * 0.9} rx={10} />
        </clipPath>
      </defs>
      <rect x={tl.x} y={tl.y} width={w} height={P(1, 0, z).y - tl.y} fill="#1a1f27" />
      <g clipPath="url(#fe-ws)">
        <rect x={tl.x} y={tl.y} width={w} height={h} fill="url(#fe-road)" />
        {/* road vanishing ahead with headlight pool and centre dashes */}
        <path d={`M${tl.x + w * 0.5} ${tl.y + h * 0.5} L${tl.x - w * 0.1} ${tl.y + h} L${tl.x + w * 1.1} ${tl.y + h}Z`} fill="#31364a" opacity={0.6} />
        {Array.from({length: 5}).map((_, i) => {
          const p = ((frame / 18 + i / 5) % 1) ** 2;
          const y = tl.y + h * (0.52 + 0.48 * p);
          return <rect key={i} x={tl.x + w * 0.5 - 2 - p * 8} y={y} width={4 + p * 16} height={4 + p * 22} fill="#d8d2bf" opacity={0.6} />;
        })}
        <ellipse cx={tl.x + w * 0.5} cy={tl.y + h * 0.82} rx={w * 0.45} ry={h * 0.2} fill="#ffe7b0" opacity={0.12} />
        {/* street lamps passing on both sides */}
        {Array.from({length: 4}).map((_, i) => {
          const p = ((frame / 40 + i / 4) % 1) ** 2.2;
          const side = i % 2 ? 1 : -1;
          const x = tl.x + w * (0.5 + side * (0.04 + 0.6 * p));
          const y = tl.y + h * (0.46 - 0.4 * p);
          return <circle key={i} cx={x} cy={y} r={3 + p * 26} fill={PAL.warm} opacity={0.85} />;
        })}
        {/* rain on windshield */}
        {Array.from({length: 40}).map((_, i) => {
          const x = tl.x + rand(i * 3.3) * w;
          const y = tl.y + rand(i * 5.1) * h;
          const vis = ((frame + i * 7) % 60) / 60;
          return <circle key={`d${i}`} cx={x} cy={y} r={2 + rand(i) * 3} fill="#cfe0ff" opacity={0.35 * (1 - vis)} />;
        })}
        {wipers ? (
          <g opacity={0.95}>
            {[0.3, 0.7].map((fx, i) => {
              const ox = tl.x + w * fx;
              const oy = tl.y + h * 0.98;
              const ang = -80 + wip * 120 - (i ? 0 : 10);
              return <line key={i} x1={ox} y1={oy} x2={ox + Math.cos((ang * Math.PI) / 180) * h * 0.85} y2={oy + Math.sin((ang * Math.PI) / 180) * h * 0.85} stroke="#0a0a0c" strokeWidth={6} strokeLinecap="round" />;
            })}
          </g>
        ) : null}
      </g>
      {/* dashboard */}
      <rect x={tl.x} y={br.y - h * 0.02} width={w} height={h * 0.16} fill="#11141a" />
      {[0.2, 0.28, 0.36, 0.7].map((fx, i) => (
        <circle key={i} cx={tl.x + w * fx} cy={br.y + h * 0.06} r={5 / (z / 6)} fill={i === 3 ? '#ff5a3a' : '#7fd1ff'} opacity={0.5 + 0.3 * light} />
      ))}
      {/* route number sign inside (reversed «13» glow) */}
      <rect x={tl.x + w * 0.62} y={tl.y + h * 0.02} width={w * 0.2} height={h * 0.08} fill="#1b1209" />
      {driver}
      {/* cabin partition (glass with frame) on the left of the aisle */}
      <rect x={P(-1, 0.85, z - 0.2).x} y={P(-1, 0.85, z - 0.2).y} width={P(-0.25, 0, z - 0.2).x - P(-1, 0.85, z - 0.2).x} height={P(-0.25, 0, z - 0.2).y - P(-1, 0.85, z - 0.2).y} fill="#9fb0c0" opacity={0.08} stroke="#2a2f38" strokeWidth={6} />
      <path d={`M${P(-0.25, 0, z - 0.2).x} ${P(-0.25, 0, z - 0.2).y} L${P(-0.25, 0.85, z - 0.2).x} ${P(-0.25, 0.85, z - 0.2).y}`} stroke="#c7a33f" strokeWidth={8} />
      {/* fare box / dashboard glare */}
      <rect x={tl.x + w * 0.06} y={tl.y + h * 0.08} width={w * 0.18} height={6} fill="#fff" opacity={0.05 + 0.03 * noise(frame / 20, 3)} />
    </svg>
  );
};

/** Far end when facing the rear: back window with the road falling away. */
export const RearEnd: React.FC<{z: number; vp?: {x: number; y: number}}> = ({z, vp = VP}) => {
  const frame = useCurrentFrame();
  const P = (X: number, Y: number, zz: number) => bp(X, Y, zz, vp);
  const tl = P(-0.9, 0.9, z);
  const br = P(0.9, 0.45, z);
  const w = br.x - tl.x;
  const h = br.y - tl.y;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="re-w">
          <rect x={tl.x} y={tl.y} width={w} height={h} rx={12} />
        </clipPath>
      </defs>
      <g clipPath="url(#re-w)">
        <rect x={tl.x} y={tl.y} width={w} height={h} fill="#0a0e19" />
        <rect x={tl.x} y={tl.y + h * 0.55} width={w} height={h * 0.45} fill="#161c2a" />
        {Array.from({length: 5}).map((_, i) => {
          const p = 1 - ((frame / 30 + i / 5) % 1);
          const s = p ** 2;
          const side = i % 2 ? 1 : -1;
          return <circle key={i} cx={tl.x + w * (0.5 + side * (0.05 + 0.55 * s))} cy={tl.y + h * (0.5 - 0.4 * s)} r={2 + s * 18} fill={PAL.warm} opacity={0.8} />;
        })}
        <path d={`M${tl.x + w * 0.5} ${tl.y + h * 0.52} L${tl.x} ${tl.y + h} L${tl.x + w} ${tl.y + h}Z`} fill="#232a3a" />
      </g>
      <rect x={tl.x} y={tl.y} width={w} height={h} rx={12} fill="none" stroke="#1d232c" strokeWidth={10} />
      {/* rear bench */}
      <path d={quad(P(-1, 0.25, z - 0.3), P(1, 0.25, z - 0.3), P(1, 0.25, z - 0.05), P(-1, 0.25, z - 0.05))} fill="#3b2e4a" />
      <rect x={P(-1, 0.55, z - 0.05).x} y={P(-1, 0.55, z - 0.05).y} width={P(1, 0.25, z - 0.05).x - P(-1, 0.55, z - 0.05).x} height={P(1, 0.25, z - 0.05).y - P(-1, 0.55, z - 0.05).y} fill="#463656" />
      <rect x={P(-1, 0.25, z - 0.3).x} y={P(-1, 0.25, z - 0.3).y} width={P(1, 0, z - 0.3).x - P(-1, 0.25, z - 0.3).x} height={P(1, 0, z - 0.3).y - P(-1, 0.25, z - 0.3).y} fill="#251d30" />
    </svg>
  );
};

/** A double seat at depth z on side s (-1 left / 1 right). `show` = which faces are visible. */
export const Seat: React.FC<{s: number; z: number; facing: 'front' | 'rear'; vp?: {x: number; y: number}; light?: number}> = ({s, z, facing, vp = VP, light = 1}) => {
  const P = (X: number, Y: number, zz: number) => bp(X, Y, zz, vp);
  const x0 = s * 0.3;
  const x1 = s * 0.96;
  const depth = 0.32;
  const base = facing === 'front' ? '#3b2e4a' : '#463656';
  const k = 0.65 + 0.35 * light;
  const shade = (c: string, m: number) => {
    const n = parseInt(c.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * m);
    const g = Math.round(((n >> 8) & 255) * m);
    const b = Math.round((n & 255) * m);
    return `rgb(${r},${g},${b})`;
  };
  // seats face the front of the bus (towards larger z when facing front)
  const zBack = facing === 'front' ? z : z + depth; // backrest plane
  const zFront = facing === 'front' ? z + depth : z;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {/* leg / frame */}
      <path d={`M${P(x0 + s * 0.05, 0, z + depth / 2).x} ${P(x0, 0, z + depth / 2).y} L${P(x0 + s * 0.05, 0.24, z + depth / 2).x} ${P(x0, 0.24, z + depth / 2).y}`} stroke="#111" strokeWidth={10 / z} />
      {/* cushion top */}
      <path d={quad(P(x0, 0.26, zFront), P(x1, 0.26, zFront), P(x1, 0.26, zBack), P(x0, 0.26, zBack))} fill={shade(base, 1.1 * k)} />
      {/* cushion front face */}
      <path d={quad(P(x0, 0.26, zFront), P(x1, 0.26, zFront), P(x1, 0.2, zFront), P(x0, 0.2, zFront))} fill={shade(base, 0.7 * k)} />
      {/* backrest */}
      <path d={quad(P(x0, 0.26, zBack), P(x1, 0.26, zBack), P(x1, 0.56, zBack), P(x0, 0.56, zBack))} fill={shade(base, (facing === 'front' ? 0.8 : 1.0) * k)} />
      <path d={quad(P(x0, 0.52, zBack), P(x1, 0.52, zBack), P(x1, 0.56, zBack), P(x0, 0.56, zBack))} fill={shade(base, 1.3 * k)} />
      {/* seam between the two seats + piping */}
      <path d={`M${P((x0 + x1) / 2, 0.27, zBack).x} ${P(0, 0.27, zBack).y} L${P((x0 + x1) / 2, 0.52, zBack).x} ${P(0, 0.52, zBack).y}`} stroke={shade(base, 0.5)} strokeWidth={4 / z} />
      <path d={`M${P(x0, 0.45, zBack).x} ${P(0, 0.45, zBack).y} L${P(x1, 0.45, zBack).x} ${P(0, 0.45, zBack).y}`} stroke={shade(base, 0.6)} strokeWidth={3 / z} opacity={0.6} />
      {/* grab handle on top of the backrest */}
      <path d={`M${P(x0 + s * 0.02, 0.56, zBack).x} ${P(x0, 0.56, zBack).y} Q${P(x0 + s * 0.02, 0.62, zBack).x} ${P(x0, 0.63, zBack).y} ${P(x0 + s * 0.12, 0.56, zBack).x} ${P(x0, 0.56, zBack).y}`} stroke="#c7a33f" strokeWidth={8 / z} fill="none" />
      {/* aisle side panel */}
      <path d={quad(P(x0, 0.2, zFront), P(x0, 0.56, zBack), P(x0, 0.2, zBack), P(x0, 0.2, zFront))} fill={shade(base, 0.55 * k)} />
    </svg>
  );
};

/** Vertical yellow pole at bus position (X, z). */
export const Pole: React.FC<{X: number; z: number; vp?: {x: number; y: number}}> = ({X, z, vp = VP}) => {
  const a = bp(X, 0, z, vp);
  const b = bp(X, 1, z, vp);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b8902e" strokeWidth={26 / z} />
      <line x1={a.x - 6 / z} y1={a.y} x2={b.x - 6 / z} y2={b.y} stroke="#f2d27a" strokeWidth={6 / z} opacity={0.8} />
    </svg>
  );
};

// ---------------- exterior ----------------

/** Old city bus seen 3/4 from the front. Origin = front bumper centre on the ground. */
export const BusFront: React.FC<{x: number; y: number; scale: number; lights?: number; route?: string; cabin?: number}> = ({x, y, scale, lights = 1, route = '13', cabin = 1}) => {
  const frame = useCurrentFrame();
  const flick = 0.9 + 0.1 * fbm(frame / 6, 4);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="bf-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3d4e4b" />
          <stop offset="0.6" stopColor="#4f625c" />
          <stop offset="1" stopColor="#2d3a38" />
        </linearGradient>
        <linearGradient id="bf-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a3533" />
          <stop offset="1" stopColor="#1b2322" />
        </linearGradient>
        <linearGradient id="bf-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8bccd" stopOpacity={0.5 * cabin} />
          <stop offset="1" stopColor="#dfe9f4" stopOpacity={0.85 * cabin} />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        {/* side receding to the left-back */}
        <path d="M-210 -40 L-210 -560 L-760 -520 L-760 -60Z" fill="url(#bf-side)" />
        {[0, 1, 2, 3].map((i) => {
          const x0 = -230 - i * 130;
          const x1 = x0 - 112;
          const t0 = -505 + i * 3;
          return <path key={i} d={`M${x0} ${t0} L${x1} ${t0 + 4} L${x1} ${-300 + i * 4} L${x0} ${-300}Z`} fill="url(#bf-glass)" />;
        })}
        <path d="M-210 -250 L-760 -240" stroke="#c9a54a" strokeWidth={8} opacity={0.6} />
        {/* wheels */}
        <ellipse cx={-330} cy={-40} rx={58} ry={64} fill="#0b0c0e" />
        <ellipse cx={-330} cy={-40} rx={26} ry={30} fill="#3a3d42" />
        <ellipse cx={-660} cy={-52} rx={52} ry={58} fill="#0b0c0e" />
        {/* front face */}
        <path d="M-220 -30 L-220 -580 Q-220 -610 -190 -610 L190 -610 Q220 -610 220 -580 L220 -30Z" fill="url(#bf-body)" stroke="#121716" strokeWidth={4} />
        {/* route display */}
        <rect x={-180} y={-596} width={360} height={74} rx={6} fill="#120c06" />
        <text x={-60} y={-538} fontFamily="Russo One" fontSize={64} fill="#ffb02e" opacity={lights * flick}>
          {route}
        </text>
        <rect x={20} y={-574} width={140} height={10} fill="#ffb02e" opacity={0.6 * lights * flick} />
        <rect x={20} y={-552} width={110} height={10} fill="#ffb02e" opacity={0.5 * lights * flick} />
        {/* windshield with lit cabin inside */}
        <path d="M-200 -510 L200 -510 L190 -270 L-190 -270Z" fill="url(#bf-glass)" stroke="#0e1211" strokeWidth={6} />
        <path d="M0 -510 L0 -270" stroke="#0e1211" strokeWidth={8} />
        {/* empty driver seat silhouette & steering wheel */}
        <path d="M-130 -300 Q-130 -360 -90 -370 L-60 -370 Q-30 -360 -30 -300Z" fill="#2c3240" opacity={0.6 * cabin} />
        <ellipse cx={-80} cy={-300} rx={46} ry={14} fill="none" stroke="#1a1d24" strokeWidth={8} opacity={0.8 * cabin} />
        {/* glare */}
        <path d="M-160 -500 L-80 -500 L-180 -290 L-200 -290Z" fill="#fff" opacity={0.12} />
        {/* bumper, grille */}
        <rect x={-210} y={-150} width={420} height={70} rx={8} fill="#1c2423" />
        {[-130, -60, 10, 80].map((gx) => (
          <rect key={gx} x={gx} y={-138} width={50} height={8} fill="#0e1312" />
        ))}
        <rect x={-220} y={-80} width={440} height={50} rx={10} fill="#111615" />
        {/* headlights */}
        {[-150, 150].map((hx) => (
          <g key={hx}>
            <circle cx={hx} cy={-190} r={34} fill="#fff6dc" opacity={0.4 + 0.6 * lights} />
            <circle cx={hx} cy={-190} r={18} fill="#ffffff" opacity={lights} />
          </g>
        ))}
        {[-190, 190].map((hx) => (
          <rect key={hx} x={hx - 14} y={-240} width={28} height={14} rx={4} fill="#ffae3c" opacity={0.5 + 0.5 * lights * (Math.floor(frame / 12) % 2)} />
        ))}
        <path d="M-226 -620 L226 -620" stroke="#0e1211" strokeWidth={6} />
      </g>
    </svg>
  );
};
export const busHeadlights = (x: number, y: number, scale: number) => [
  {x: x - 150 * scale, y: y - 190 * scale},
  {x: x + 150 * scale, y: y - 190 * scale},
];

/** Bus side view at the stop with folding doors. `door` 0 closed … 1 open. Origin = ground at door centre. */
export const BusSide: React.FC<{x: number; y: number; scale: number; door: number; light?: number; children?: React.ReactNode}> = ({x, y, scale, door, light = 1, children}) => {
  const L = light;
  const cabin = `rgba(${Math.round(190 + 40 * L)},${Math.round(208 + 36 * L)},${Math.round(222 + 30 * L)},${0.35 + 0.55 * L})`;
  const doorW = 190;
  const leaf = doorW / 2;
  const open = Math.max(0, Math.min(1, door));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="bs-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5d58" />
          <stop offset="0.7" stopColor="#3a4a46" />
          <stop offset="1" stopColor="#222b29" />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <rect x={-1400} y={-640} width={2600} height={600} rx={30} fill="url(#bs-body)" stroke="#111716" strokeWidth={4} />
        {/* windows */}
        {Array.from({length: 9}).map((_, i) => {
          const wx = -1360 + i * 280;
          if (wx > -doorW / 2 - 260 && wx < doorW / 2 + 10) return null;
          return <rect key={i} x={wx} y={-600} width={240} height={230} rx={10} fill={cabin} stroke="#101414" strokeWidth={6} />;
        })}
        <path d="M-1400 -330 L1200 -330" stroke="#c9a54a" strokeWidth={10} opacity={0.6} />
        {/* door opening (interior light) */}
        <rect x={-doorW / 2} y={-610} width={doorW} height={570} fill={cabin} />
        {children}
        {/* steps */}
        <rect x={-doorW / 2} y={-90} width={doorW} height={22} fill="#2a2f36" />
        <rect x={-doorW / 2} y={-50} width={doorW} height={14} fill="#c7a33f" opacity={0.6} />
        {/* folding leaves */}
        {[-1, 1].map((sd) => {
          const w = leaf * (1 - open * 0.82);
          const x0 = sd < 0 ? -doorW / 2 : doorW / 2 - w;
          return (
            <g key={sd}>
              <rect x={x0} y={-610} width={w} height={570} fill="#3c4c48" stroke="#111716" strokeWidth={4} />
              <rect x={x0 + w * 0.15} y={-580} width={w * 0.7} height={300} fill={cabin} opacity={0.8} />
              <rect x={x0 + w * 0.15} y={-260} width={w * 0.7} height={190} fill={cabin} opacity={0.6} />
            </g>
          );
        })}
        {/* wheels */}
        {[-950, 820].map((wx) => (
          <g key={wx}>
            <circle cx={wx} cy={-40} r={92} fill="#0a0b0d" />
            <circle cx={wx} cy={-40} r={42} fill="#3a3d42" />
          </g>
        ))}
        {/* route sign by the door */}
        <rect x={-doorW / 2 - 230} y={-360} width={160} height={70} rx={6} fill="#120c06" />
        <text x={-doorW / 2 - 195} y={-306} fontFamily="Russo One" fontSize={52} fill="#ffb02e">
          13
        </text>
      </g>
    </svg>
  );
};
