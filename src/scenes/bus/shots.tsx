// Reusable shots for the bus episode.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, CameraRig, Layer} from '../../camera/Camera';
import {BusInterior, FrontEnd, Pole, RearEnd, Seat, VP, bp, personScale} from './world/Bus';
import {WindowView} from './world/Places';
import {Mist, Rain, RainOnGlass} from '../../effects/Weather';
import {Act, ActorSpec, L_BUS, dim} from './common';
import {Design, Light, Pose} from '../../characters/types';
import {MouthParams} from '../../characters/Head';

export const SEAT_ZS = [1.5, 2.4, 3.3, 4.2, 5.1, 6.0, 6.9];

export type Occupant = {
  d: Design;
  p: Pose;
  X: number; // lateral position (seat ≈ ±0.6, aisle 0)
  z: number;
  Y?: number; // pelvis height (seated 0.27, standing 0.373)
  id: string;
  mouth?: MouthParams;
  light?: Light;
  opacity?: number;
};

/** Pelvis screen position + scale for someone at bus position (X, z). */
export const placeAt = (X: number, z: number, Y = 0.27, vp = VP) => {
  const p = bp(X, Y, z, vp);
  return {x: p.x, y: p.y, s: personScale(z)};
};

export const AisleShot: React.FC<{
  facing: 'front' | 'rear';
  cam: Cam;
  light?: number;
  speed?: number;
  occupants?: Occupant[];
  driver?: Occupant | null;
  zFar?: number;
  wipers?: boolean;
  seats?: number[];
  extra?: React.ReactNode;
}> = ({facing, cam, light = 1, speed = 1, occupants = [], driver = null, zFar = 7.8, wipers = true, seats, extra}) => {
  // camera stands just in front of the row it looks at: no seat between it and the nearest people
  seats = seats ?? (facing === 'rear' ? SEAT_ZS.slice(1) : SEAT_ZS);
  const lt = dim(L_BUS, 0.4 + 0.6 * light);
  type Item = {z: number; node: React.ReactNode};
  const items: Item[] = [];
  for (const z of seats) {
    if (z > zFar - 0.6) continue;
    for (const s of [-1, 1]) items.push({z: z + 0.16, node: <Seat key={`s${s}${z}`} s={s} z={z} facing={facing} light={light} />});
  }
  for (const z of [2.0, 4.6]) for (const X of [-0.3, 0.3]) items.push({z, node: <Pole key={`p${X}${z}`} X={X} z={z} />});
  for (const o of occupants) {
    const pl = placeAt(o.X, o.z, o.Y ?? 0.27);
    // facing front: the person is behind the seat back → draw before the seat (larger z)
    const zz = facing === 'front' ? o.z + 0.2 : o.z - 0.05;
    items.push({
      z: zz,
      node: <Act key={o.id} d={o.d} p={o.p} x={pl.x} y={pl.y} s={pl.s} id={o.id} light={o.light ?? lt} mouth={o.mouth} opacity={o.opacity} />,
    });
  }
  items.sort((a, b) => b.z - a.z);
  let driverNode: React.ReactNode = null;
  if (driver) {
    const pl = placeAt(driver.X, driver.z, driver.Y ?? 0.27);
    driverNode = <Act d={driver.d} p={driver.p} x={pl.x} y={pl.y} s={pl.s} id={driver.id} light={driver.light ?? lt} mouth={driver.mouth} legs={false} />;
  }
  return (
    <CameraRig cam={cam}>
      <Layer depth={1}>
        <AbsoluteFill style={{background: '#06080d'}} />
        <BusInterior facing={facing} light={light} speed={speed} zFar={zFar} />
        {facing === 'front' ? <FrontEnd z={zFar} light={light} wipers={wipers} driver={null} /> : <RearEnd z={zFar} />}
        {driverNode}
        {items.map((it) => it.node)}
        {extra}
        <Mist y={1500} height={500} color="150,170,210" opacity={0.06} seed={4} />
      </Layer>
    </CameraRig>
  );
};

/**
 * Gleb seated by the right-hand window, camera inside the bus looking at
 * him; the city slides by behind the glass; rain beads on the window; his
 * faint reflection in the glass.
 */
export const GlebWindowShot: React.FC<{
  cam: Cam;
  t: number;
  gleb: ActorSpec;
  speed?: number;
  passes?: number[];
  light?: number;
  reflection?: boolean;
  windowRect?: [number, number, number, number];
  extra?: React.ReactNode;
  bgBlur?: number;
}> = ({cam, t, gleb, speed = 900, passes = [], light = 1, reflection = true, windowRect = [-60, 260, 1200, 860], extra, bgBlur = 2.5}) => {
  const [wx, wy, ww, wh] = windowRect;
  const wall = `rgb(${Math.round(46 + 60 * light)},${Math.round(58 + 66 * light)},${Math.round(66 + 70 * light)})`;
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5}>
        <AbsoluteFill style={{background: wall}} />
        <div style={{position: 'absolute', left: wx, top: wy, width: ww, height: wh, overflow: 'hidden', borderRadius: 26}}>
          <div style={{position: 'absolute', left: 0, top: -wy * 0.3, width: ww, height: 1920, filter: bgBlur ? `blur(${bgBlur}px)` : undefined}}>
            <WindowView t={t} speed={speed} passes={passes} w={ww} h={1500} drops={false} />
          </div>
          <Rain count={60} seed={21} angle={-24} speed={30} length={50} opacity={0.18} />
          <RainOnGlass w={ww} h={wh} density={1.6} seed={11} />
          {reflection ? (
            <div style={{position: 'absolute', inset: 0, opacity: 0.16, transform: 'scaleX(-1) translateX(-80px)', filter: 'blur(1.5px)', mixBlendMode: 'screen'}}>
              <Act {...gleb} x={gleb.x - wx} y={gleb.y - wy} id={`${gleb.id}-refl`} />
            </div>
          ) : null}
        </div>
        {/* window frame + rubber seal */}
        <div style={{position: 'absolute', left: wx, top: wy, width: ww, height: wh, borderRadius: 26, boxShadow: 'inset 0 0 0 16px #1a1f27, inset 0 0 40px 20px rgba(0,0,0,0.5)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: wy + wh, height: 26, background: '#39424e'}} />
      </Layer>
      <Layer depth={1}>
        {/* seat back behind Gleb */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <path d={`M${gleb.x - 330} ${gleb.y - 520} Q${gleb.x - 330} ${gleb.y - 600} ${gleb.x - 250} ${gleb.y - 600} L${gleb.x + 260} ${gleb.y - 600} Q${gleb.x + 330} ${gleb.y - 600} ${gleb.x + 330} ${gleb.y - 520} L${gleb.x + 330} ${gleb.y + 80} L${gleb.x - 330} ${gleb.y + 80}Z`} fill="#3b2e4a" />
          <path d={`M${gleb.x - 330} ${gleb.y - 560} L${gleb.x + 330} ${gleb.y - 560}`} stroke="#4e3e60" strokeWidth={20} />
          <rect x={-100} y={gleb.y + 60} width={1300} height={900} fill="#251d30" />
        </svg>
        <Act {...gleb} />
        {/* cold top light falling on Gleb, warm spill from the street */}
        <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% 10%, rgba(210,230,255,${0.12 * light}), transparent 70%)`, mixBlendMode: 'screen', pointerEvents: 'none'}} />
        {extra}
      </Layer>
    </CameraRig>
  );
};

/**
 * Driver's cab seen from the entrance: big windshield with the wet night road
 * and wipers, dashboard glow, steering wheel; the driver (or nobody) in the seat.
 */
export const DriverCabShot: React.FC<{
  cam: Cam;
  f: number;
  driver?: ActorSpec | null;
  light?: number;
  wheelTurn?: number; // deg, for the self-driving wheel in the finale
  extra?: React.ReactNode;
  clock?: string;
}> = ({cam, f, driver, light = 1, wheelTurn = 0, extra, clock = '23:50'}) => {
  const wip = Math.sin(f / 14) * 0.5 + 0.5;
  const lamps = Array.from({length: 4}).map((_, i) => {
    const p = ((f / 45 + i / 4) % 1) ** 2.2;
    const side = i % 2 ? 1 : -1;
    return {x: 540 + side * (40 + 760 * p), y: 520 - 380 * p, r: 4 + 50 * p};
  });
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5}>
        <AbsoluteFill style={{background: '#05070c'}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="dc-road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#070b16" />
              <stop offset="0.45" stopColor="#161d33" />
              <stop offset="1" stopColor="#262a3a" />
            </linearGradient>
            <clipPath id="dc-ws">
              <path d="M-40 140 L1120 140 L1120 1060 L-40 1060Z" />
            </clipPath>
            <filter id="dc-b">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <g clipPath="url(#dc-ws)">
            <rect x={-40} y={140} width={1160} height={920} fill="url(#dc-road)" />
            <path d="M540 560 L-200 1060 L1280 1060Z" fill="#2c3145" opacity={0.7} />
            {Array.from({length: 6}).map((_, i) => {
              const p = ((f / 16 + i / 6) % 1) ** 2;
              return <rect key={i} x={536 - p * 14} y={570 + 490 * p} width={8 + p * 26} height={6 + p * 40} fill="#d8d2bf" opacity={0.55} />;
            })}
            <ellipse cx={540} cy={960} rx={520} ry={150} fill="#ffe8b8" opacity={0.1} />
            <g filter="url(#dc-b)">
              {lamps.map((l, i) => (
                <circle key={i} cx={l.x} cy={l.y} r={l.r} fill="#ffc46b" opacity={0.9} />
              ))}
            </g>
            {Array.from({length: 60}).map((_, i) => {
              const life = ((f + i * 11) % 50) / 50;
              const swept = wip > 0.3 && wip < 0.7;
              return <circle key={`d${i}`} cx={(i * 137) % 1100} cy={160 + ((i * 89) % 880)} r={2 + (i % 4)} fill="#cfe0ff" opacity={(swept ? 0.15 : 0.4) * (1 - life)} />;
            })}
            {[260, 820].map((ox, i) => {
              const ang = -170 + wip * 140 + (i ? 10 : 0);
              const r = (ang * Math.PI) / 180;
              return <line key={i} x1={ox} y1={1060} x2={ox + Math.cos(r) * 640} y2={1060 + Math.sin(r) * 640} stroke="#07080a" strokeWidth={10} strokeLinecap="round" />;
            })}
          </g>
          {/* pillars & roof */}
          <rect x={-40} y={0} width={1160} height={150} fill="#141820" />
          <path d="M-40 140 L60 140 L-40 1080Z" fill="#11151c" />
          <path d="M1120 140 L1020 140 L1120 1080Z" fill="#11151c" />
          <rect x={300} y={40} width={300} height={70} rx={8} fill="#1b1209" />
          <text x={450} y={96} textAnchor="middle" fontFamily="Russo One" fontSize={52} fill="#ffb02e" opacity={0.25} transform="scale(-1 1) translate(-900 0)">
            13
          </text>
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {/* driver seat (visible when empty) */}
          {!driver ? (
            <g>
              <path d="M300 1000 Q300 880 380 870 L560 870 Q640 880 640 1000 L640 1500 L300 1500Z" fill="#2a2f3a" />
              <path d="M330 900 L610 900" stroke="#3a4150" strokeWidth={14} />
              <rect x={400} y={780} width={140} height={110} rx={30} fill="#2a2f3a" />
            </g>
          ) : null}
          {/* dashboard */}
          <path d="M-40 1060 L1120 1060 L1120 1920 L-40 1920Z" fill="#0d1015" />
          <path d="M-40 1060 Q540 1010 1120 1060 L1120 1120 Q540 1080 -40 1120Z" fill="#1a1e26" />
          {[[700, 1180, '#7fd1ff'], [760, 1180, '#7fd1ff'], [830, 1180, '#ff5a3a'], [900, 1200, '#a4ff8f']].map(([x, y, c], i) => (
            <circle key={i} cx={x as number} cy={y as number} r={10} fill={c as string} opacity={0.5 + 0.4 * light} />
          ))}
          <rect x={640} y={1230} width={320} height={110} rx={10} fill="#0a1a24" />
          <text x={800} y={1302} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={56} fill="#6fd0ff" opacity={0.75}>
            {clock}
          </text>
        </svg>
        {driver ? <Act {...driver} legs={false} /> : null}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {/* steering wheel */}
          <g transform={`translate(460 1330) rotate(${wheelTurn})`}>
            <ellipse cx={0} cy={0} rx={250} ry={150} fill="none" stroke="#0a0b0e" strokeWidth={34} />
            <ellipse cx={0} cy={-6} rx={250} ry={150} fill="none" stroke="#2c3038" strokeWidth={6} />
            <path d="M-240 10 L-60 30 M240 10 L60 30 M0 40 L0 140" stroke="#0a0b0e" strokeWidth={26} />
            <ellipse cx={0} cy={30} rx={70} ry={40} fill="#15171c" />
          </g>
        </svg>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 30% at 70% 70%, rgba(110,200,255,0.10), transparent 70%)', mixBlendMode: 'screen'}} />
        {extra}
      </Layer>
    </CameraRig>
  );
};
