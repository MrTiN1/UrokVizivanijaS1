// New props for episode 2 «Пустое место», built on the episode-1 world kit:
// rear-view mirror with a reflection, palm prints on the rear glass, the
// view through the rear window (road + the double), the old paper ticket,
// the wall of passenger photos, and the view out of the open doors.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character} from '../../../characters/Character';
import {COAT_MAN, DRIVER, GLEB_CIVIL, OLD_WOMAN} from '../../../characters/designs';
import {Design, Light, Pose, basePose} from '../../../characters/types';
import {MouthParams} from '../../../characters/Head';
import {noise, rand} from '../../../animation/core';
import {BusShelter, StopSign} from '../../bus/world/Places';
import {NightSky, PAL, StreetLamp, lampHead, BuildingRow, blocks} from '../../bus/world/City';
import {Glow, LightCone, Mist, Rain, RainOnGlass, Splashes, WetReflections} from '../../../effects/Weather';

export const L_MIRROR: Light = {x: -0.2, y: -0.8, rim: '#bcd6ff', rimStrength: 0.4, shade: '#1a1f33', shadeStrength: 0.55};
export const L_TAIL: Light = {x: 0, y: 0.6, rim: '#ff5a4a', rimStrength: 0.75, shade: '#140a12', shadeStrength: 0.65};

// ---------------------------------------------------------------- mirror
/**
 * Rear-view mirror (housing + glass). The reflection is drawn mirrored:
 * the bus interior behind the driver's seat and — only in the glass — the
 * driver himself. Origin = mirror centre; w×h = glass size.
 */
export const RearMirror: React.FC<{x: number; y: number; w: number; h: number; driver?: {pose: Pose; mouth?: MouthParams} | null; light?: number; id: string}> = ({
  x,
  y,
  w,
  h,
  driver,
  light = 1,
  id,
}) => {
  const r = h * 0.42;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r} />
        </clipPath>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`rgb(${Math.round(80 + 70 * light)},${Math.round(92 + 70 * light)},${Math.round(104 + 70 * light)})`} />
          <stop offset="0.55" stopColor="#2c3442" />
          <stop offset="1" stopColor="#141820" />
        </linearGradient>
        <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.06} />
        </linearGradient>
      </defs>
      {/* stem */}
      <rect x={x - w * 0.03} y={y - h / 2 - h * 0.9} width={w * 0.06} height={h * 0.9} fill="#0e1015" />
      {/* housing */}
      <rect x={x - w / 2 - h * 0.08} y={y - h / 2 - h * 0.08} width={w + h * 0.16} height={h * 1.16} rx={r * 1.15} fill="#0b0c10" />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={`url(#${id}-bg)`} />
        {/* reflected interior: ceiling tubes, yellow poles, seat rows (mirrored = drawn reversed) */}
        <g transform={`translate(${x} ${y}) scale(-1 1)`}>
          {[-0.36, -0.12, 0.12].map((k, i) => (
            <rect key={i} x={k * w} y={-h * 0.48} width={w * 0.16} height={h * 0.07} fill="#e9f3ff" opacity={0.35 + 0.5 * light} />
          ))}
          {[-0.42, 0.3].map((k, i) => (
            <rect key={`p${i}`} x={k * w} y={-h / 2} width={w * 0.025} height={h} fill="#b8902e" opacity={0.8} />
          ))}
          {[-0.5, -0.2, 0.25].map((k, i) => (
            <rect key={`s${i}`} x={k * w} y={h * 0.12} width={w * 0.22} height={h * 0.4} rx={8} fill="#3b2e4a" opacity={0.9} />
          ))}
          {driver ? (
            <g transform={`translate(${-w * 0.08} ${h * 0.9}) scale(${h / 470})`}>
              <Character design={DRIVER} pose={driver.pose} light={L_MIRROR} x={0} y={0} scale={1} idp={`${id}-d`} mouth={driver.mouth} legs={false} />
            </g>
          ) : null}
        </g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={`url(#${id}-glare)`} />
      </g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r} fill="none" stroke="#2a2e38" strokeWidth={Math.max(2, h * 0.025)} />
    </svg>
  );
};

// ---------------------------------------------------------------- handprints
const palm = (s: number) =>
  `M${-34 * s} ${10 * s} Q${-40 * s} ${-30 * s} ${-26 * s} ${-44 * s} L${-26 * s} ${-96 * s} Q${-26 * s} ${-106 * s} ${-18 * s} ${-106 * s} Q${-10 * s} ${-106 * s} ${-10 * s} ${-96 * s} L${-10 * s} ${-60 * s} L${-8 * s} ${-114 * s} Q${-8 * s} ${-124 * s} ${0} ${-124 * s} Q${8 * s} ${-124 * s} ${8 * s} ${-114 * s} L${8 * s} ${-60 * s} L${12 * s} ${-108 * s} Q${12 * s} ${-118 * s} ${20 * s} ${-118 * s} Q${28 * s} ${-118 * s} ${28 * s} ${-108 * s} L${26 * s} ${-54 * s} L${34 * s} ${-82 * s} Q${38 * s} ${-90 * s} ${44 * s} ${-86 * s} Q${50 * s} ${-82 * s} ${46 * s} ${-72 * s} L${36 * s} ${-20 * s} Q${30 * s} ${24 * s} ${0} ${30 * s} Q${-28 * s} ${30 * s} ${-34 * s} ${10 * s}Z`;

export type Print = {x: number; y: number; s: number; rot: number; at: number; flip?: boolean};

/** Palm prints in the condensation of the rear glass, fading in at their `at` time (seconds). */
export const Handprints: React.FC<{prints: Print[]; t: number}> = ({prints, t}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {prints.map((p, i) => {
      const a = Math.max(0, Math.min(1, (t - p.at) / 0.35));
      if (a <= 0) return null;
      return (
        <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.flip ? -1 : 1} 1)`} opacity={a}>
          <path d={palm(p.s)} fill="#d7e3f2" opacity={0.28} />
          <path d={palm(p.s)} fill="none" stroke="#eef4ff" strokeWidth={2 * p.s} opacity={0.35} />
          {/* drips running down from the print */}
          {[-14, 4, 20].map((dx, k) => {
            const len = (20 + rand(i * 7 + k) * 70) * p.s * Math.min(1, (t - p.at) / 2);
            return <line key={k} x1={dx * p.s} y1={26 * p.s} x2={dx * p.s + noise(k + i, 1) * 3} y2={26 * p.s + len} stroke="#e1ebf8" strokeWidth={3 * p.s} opacity={0.25} strokeLinecap="round" />;
          })}
        </g>
      );
    })}
  </svg>
);

// ---------------------------------------------------------------- rear window view
/**
 * Looking out through the rear window while the bus drives away: the wet
 * road falling back to the vanishing point, red tail-light glow on the
 * asphalt, lamps receding on both sides, rain; optional figure on the road.
 */
export const RearRoad: React.FC<{figure?: {d: Design; p: Pose; x: number; y: number; s: number; mouth?: MouthParams} | null; id: string}> = ({figure, id}) => {
  const f = useCurrentFrame();
  const vpY = 820;
  const lamps = Array.from({length: 6}).map((_, i) => {
    const p = (f / 70 + i / 6) % 1; // 0 near → 1 far (receding)
    const d = 1 - p;
    const side = i % 2 ? 1 : -1;
    const sc = 0.12 + d * d * 1.1;
    const x = 540 + side * (60 + 760 * d * d);
    const base = vpY + 30 + 900 * d * d;
    return {x, base, sc, side, k: i, d};
  });
  return (
    <AbsoluteFill>
      <NightSky horizon={vpY} id={`${id}-sky`} />
      <BuildingRow base={vpY + 20} blds={blocks(31, 18, -300, 1400, 200, 600)} color={PAL.bldFar} lit={0.25} winScale={0.6} haze={0.4} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c2233" />
            <stop offset="1" stopColor="#0a0d14" />
          </linearGradient>
          <radialGradient id={`${id}-tail`} cx="0.5" cy="1" r="0.7">
            <stop offset="0" stopColor="#ff3b2e" stopOpacity={0.55} />
            <stop offset="1" stopColor="#ff3b2e" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={`M540 ${vpY} L-400 1920 L1480 1920Z`} fill={`url(#${id}-road)`} />
        <path d={`M540 ${vpY} L-900 1920 L-400 1920Z M540 ${vpY} L1480 1920 L1980 1920Z`} fill="#141a24" />
        {Array.from({length: 7}).map((_, i) => {
          const p = ((f / 22 + i / 7) % 1) ** 2;
          const dd = 1 - p;
          const y = vpY + 1100 * dd * dd;
          return <rect key={i} x={540 - 4 - 20 * dd * dd} y={y} width={8 + 40 * dd * dd} height={6 + 70 * dd * dd} fill="#d8d2bf" opacity={0.45} />;
        })}
        <ellipse cx={540} cy={1920} rx={900} ry={520} fill={`url(#${id}-tail)`} />
      </svg>
      <WetReflections ground={vpY + 40} lights={lamps.map((l) => ({...lampHead(l.x, l.base, 760, -l.side, l.sc), color: PAL.warm, size: 40 * l.sc + 6}))} depth={600} seed={7} />
      {lamps
        .slice()
        .sort((a, b) => a.d - b.d)
        .map((l) => (
          <React.Fragment key={l.k}>
            <StreetLamp x={l.x} base={l.base} h={760} dir={-l.side} scale={l.sc} />
            <Glow x={lampHead(l.x, l.base, 760, -l.side, l.sc).x} y={lampHead(l.x, l.base, 760, -l.side, l.sc).y} r={60 + 260 * l.sc} color={PAL.warm} core="#fff3d6" intensity={0.9} />
          </React.Fragment>
        ))}
      <Mist y={vpY + 60} height={360} color="140,150,190" opacity={0.2} />
      {figure ? (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <ellipse cx={figure.x} cy={figure.y + 430 * figure.s} rx={140 * figure.s} ry={20 * figure.s} fill="#000" opacity={0.4} />
          <Character design={figure.d} pose={figure.p} light={L_TAIL} x={figure.x} y={figure.y} scale={figure.s} idp={`${id}-fig`} mouth={figure.mouth} />
        </svg>
      ) : null}
      <Splashes y0={vpY + 120} y1={1920} count={40} />
      <Rain count={110} seed={41} angle={4} speed={40} length={60} width={1.3} opacity={0.24} />
    </AbsoluteFill>
  );
};

/** The rear window frame seen from inside, with drops and (optional) palm prints. Children = outside view. */
export const RearWindow: React.FC<{t: number; prints?: Print[]; children: React.ReactNode; light?: number}> = ({t, prints = [], children, light = 1}) => {
  const wx = 60;
  const wy = 360;
  const ww = 960;
  const wh = 900;
  const wall = `rgb(${Math.round(34 + 40 * light)},${Math.round(42 + 46 * light)},${Math.round(50 + 52 * light)})`;
  return (
    <AbsoluteFill style={{background: wall}}>
      <div style={{position: 'absolute', left: wx, top: wy, width: ww, height: wh, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -wx, top: -wy, width: 1080, height: 1920}}>{children}</div>
        <RainOnGlass w={ww} h={wh} density={1.6} seed={17} />
        <div style={{position: 'absolute', left: -wx, top: -wy, width: 1080, height: 1920}}>
          <Handprints prints={prints} t={t} />
        </div>
      </div>
      <div style={{position: 'absolute', left: wx, top: wy, width: ww, height: wh, border: '22px solid #161a21', boxSizing: 'border-box', background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 62%, rgba(0,0,0,0.5) 100%)'}} />
      {/* rear bench top and handrail */}
      <div style={{position: 'absolute', left: 0, right: 0, top: wy + wh, height: 40, background: '#4e3e60'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: wy + wh + 40, bottom: 0, background: 'linear-gradient(#3b2e4a,#1b1524)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: wy - 60, height: 14, background: '#c7a33f', opacity: 0.8}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- ticket
/** Old paper bus ticket. Origin = centre, size 560×320 at scale 1. */
export const Ticket: React.FC<{x: number; y: number; scale?: number; rot?: number}> = ({x, y, scale = 1, rot = 0}) => {
  const W = 560;
  const H = 320;
  const holes = Array.from({length: 14}).map((_, i) => -H / 2 + 12 + i * ((H - 24) / 13));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="tk-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe2c2" />
          <stop offset="0.6" stopColor="#e2d0a6" />
          <stop offset="1" stopColor="#cdb685" />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
        <rect x={-W / 2 + 6} y={-H / 2 + 10} width={W} height={H} fill="#000" opacity={0.35} />
        <path d={`M${-W / 2} ${-H / 2} H${W / 2} V${H / 2} H${-W / 2}Z`} fill="url(#tk-paper)" />
        {/* stub perforation */}
        <line x1={-W / 2 + 120} y1={-H / 2} x2={-W / 2 + 120} y2={H / 2} stroke="#8a7650" strokeWidth={2} strokeDasharray="6 7" />
        {holes.map((hy, i) => (
          <circle key={i} cx={-W / 2} cy={hy} r={5} fill="#2a2420" />
        ))}
        <rect x={-W / 2 + 130} y={-H / 2 + 14} width={W - 144} height={18} fill="#9c3a2e" opacity={0.85} />
        <text x={-W / 2 + 60} y={-30} textAnchor="middle" fontFamily="Russo One" fontSize={64} fill="#5a4a32" transform={`rotate(-90 ${-W / 2 + 60} -30)`}>
          13
        </text>
        <text x={-W / 2 + 145} y={-H / 2 + 62} fontFamily="Oswald" fontWeight={600} fontSize={20} letterSpacing={3} fill="#6b5a3d">
          АВТОБУСНЫЙ БИЛЕТ · № 000013
        </text>
        {[
          ['МАРШРУТ №13', 104],
          ['ПАССАЖИР: ГЛЕБ', 164],
          ['ДАТА: ЗАВТРА', 224],
        ].map(([s, yy], i) => (
          <text key={i} x={-W / 2 + 145} y={-H / 2 + (yy as number)} fontFamily="Oswald" fontWeight={700} fontSize={44} letterSpacing={2} fill="#2c241a">
            {s}
          </text>
        ))}
        <circle cx={W / 2 - 70} cy={H / 2 - 70} r={44} fill="none" stroke="#7a2a24" strokeWidth={4} opacity={0.5} />
        <text x={W / 2 - 70} y={H / 2 - 62} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={22} fill="#7a2a24" opacity={0.55}>
          ГОРТРАНС
        </text>
        {/* wear: stains and creases */}
        <ellipse cx={120} cy={-40} rx={70} ry={30} fill="#a88a55" opacity={0.18} />
        <line x1={20} y1={-H / 2} x2={40} y2={H / 2} stroke="#b9a273" strokeWidth={2} opacity={0.5} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- photo wall
const PORTRAIT_LIGHT: Light = {x: 0.5, y: -0.6, rim: '#fff2d8', rimStrength: 0.3, shade: '#3a2f2a', shadeStrength: 0.35};

/** One polaroid-style photo with a portrait and a handwritten-style caption. */
export const PhotoCard: React.FC<{x: number; y: number; rot: number; d: Design; caption: string; id: string; scale?: number; sepia?: number; red?: boolean; pose?: Partial<Pose>}> = ({
  x,
  y,
  rot,
  d,
  caption,
  id,
  scale = 1,
  sepia = 0.5,
  red,
  pose = {},
}) => {
  const W = 300;
  const H = 360;
  const p = {...basePose(), bodyTurn: 0.15, headTurn: 0.15, lidDrop: 0.15, ...pose};
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}-pc`}>
          <rect x={-W / 2 + 18} y={-H / 2 + 18} width={W - 36} height={W - 36} />
        </clipPath>
      </defs>
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
        <rect x={-W / 2 + 8} y={-H / 2 + 12} width={W} height={H} fill="#000" opacity={0.4} />
        <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#ece6d8" />
        <g clipPath={`url(#${id}-pc)`}>
          <rect x={-W / 2 + 18} y={-H / 2 + 18} width={W - 36} height={W - 36} fill="#2f3646" />
          <rect x={-W / 2 + 18} y={-H / 2 + 18} width={W - 36} height={60} fill="#dfe9f4" opacity={0.25} />
          <rect x={W / 2 - 70} y={-H / 2 + 18} width={14} height={W - 36} fill="#b8902e" opacity={0.7} />
          <Character design={d} pose={p} light={PORTRAIT_LIGHT} x={0} y={-H / 2 + 18 + 470 * 0.55} scale={0.55} idp={`${id}-ch`} legs={false} />
          <rect x={-W / 2 + 18} y={-H / 2 + 18} width={W - 36} height={W - 36} fill="#8a6a3a" opacity={sepia * 0.45} />
        </g>
        <text x={0} y={H / 2 - 24} textAnchor="middle" fontFamily="Oswald" fontWeight={600} fontSize={caption.length > 16 ? 26 : 32} fill={red ? '#9c2a22' : '#2c2a35'} transform={`rotate(-1.5 0 ${H / 2 - 24})`}>
          {caption}
        </text>
        {/* tape */}
        <rect x={-46} y={-H / 2 - 16} width={92} height={30} fill="#efe9d2" opacity={0.75} transform="rotate(-4)" />
      </g>
    </svg>
  );
};

export const PHOTO_SET = [
  {d: OLD_WOMAN, caption: '15 ноября · 20 лет назад', rot: -4, sepia: 0.85},
  {d: COAT_MAN, caption: '15 ноября · 15 лет назад', rot: 3, sepia: 0.6},
  {d: GLEB_CIVIL, caption: 'ЗАВТРА, 00:13', rot: -2, sepia: 0, red: true},
];

/** Wall panel by the cab with the passengers' photos pinned to it. */
export const PhotoWall: React.FC<{light?: number}> = ({light = 1}) => (
  <AbsoluteFill style={{background: `rgb(${Math.round(36 + 40 * light)},${Math.round(44 + 44 * light)},${Math.round(52 + 50 * light)})`}}>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <rect x={0} y={0} width={1080} height={300} fill="#1b2029" />
      <rect x={0} y={300} width={1080} height={16} fill="#c7a33f" opacity={0.7} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={80 + i * 300} cy={360} r={8} fill="#7d8796" />
      ))}
      <rect x={0} y={1580} width={1080} height={340} fill="#3b2e4a" />
      <rect x={0} y={1560} width={1080} height={24} fill="#4e3e60" />
      {/* old route map, faded */}
      <rect x={720} y={420} width={300} height={180} fill="#d9d2bf" opacity={0.18} />
      <path d="M740 560 Q800 470 860 520 T1000 450" stroke="#9c3a2e" strokeWidth={4} fill="none" opacity={0.3} />
    </svg>
  </AbsoluteFill>
);

// ---------------------------------------------------------------- door view
/**
 * From inside the bus looking out of the open front doors at the stop where
 * Gleb got on (episode 1): shelter, «ПРОСПЕКТ МИРА» sign, lamp, rain — and
 * whoever stands there. `door` 0 closed … 1 open.
 */
export const DoorView: React.FC<{door: number; figure?: {p: Pose; x: number; y: number; s: number; mouth?: MouthParams} | null; light?: number}> = ({door, figure, light = 1}) => {
  const dx0 = 250;
  const dx1 = 830;
  const top = 260;
  const bottom = 1560;
  const leafW = (dx1 - dx0) / 2;
  const open = Math.max(0, Math.min(1, door));
  const wall = `rgb(${Math.round(38 + 44 * light)},${Math.round(48 + 50 * light)},${Math.round(56 + 56 * light)})`;
  const lamp = lampHead(860, 1420, 900, -1, 0.9);
  return (
    <AbsoluteFill style={{background: '#05070c'}}>
      {/* outside */}
      <div style={{position: 'absolute', left: dx0, top, width: dx1 - dx0, height: bottom - top, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -dx0, top: -top, width: 1080, height: 1920}}>
          <NightSky horizon={1000} id="dv-sky" />
          <BuildingRow base={1150} blds={blocks(22, 14, -300, 1500, 450, 900)} lit={0.3} haze={0.25} />
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <rect x={0} y={1300} width={1080} height={700} fill="#1f2531" />
            <rect x={0} y={1290} width={1080} height={14} fill="#2c3340" />
          </svg>
          <BusShelter x={520} y={1330} scale={0.9} light={0.9} />
          <StopSign x={330} y={1340} scale={0.75} name="ПРОСПЕКТ МИРА" />
          <StreetLamp x={860} base={1420} h={900} dir={-1} scale={0.9} />
          <Glow x={lamp.x} y={lamp.y} r={280} color={PAL.warm} core="#fff3d6" />
          <LightCone x={lamp.x} y={lamp.y} w0={30} w1={560} h={1000} intensity={0.7} seed={51} />
          <WetReflections ground={1310} lights={[{x: lamp.x, y: lamp.y, color: PAL.warm, size: 60}, {x: 520, y: 760, color: '#dfe9f4', size: 80, intensity: 0.5}]} />
          {figure ? (
            <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <ellipse cx={figure.x} cy={figure.y + 430 * figure.s} rx={130 * figure.s} ry={18 * figure.s} fill="#000" opacity={0.45} />
              <Character design={GLEB_CIVIL} pose={figure.p} light={{x: 0.6, y: -0.7, rim: '#ffcf8a', rimStrength: 0.75, shade: '#141a30', shadeStrength: 0.6}} x={figure.x} y={figure.y} scale={figure.s} idp="dv-twin" mouth={figure.mouth} />
            </svg>
          ) : null}
          <Splashes y0={1310} y1={1920} count={30} />
          <Rain count={90} seed={52} angle={8} speed={42} length={60} width={1.3} opacity={0.26} />
          <Mist y={1300} height={300} opacity={0.12} />
        </div>
      </div>
      {/* interior wall around the doorway */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d={`M0 0 H1080 V1920 H0Z M${dx0} ${top} V${bottom} H${dx1} V${top}Z`} fill={wall} fillRule="evenodd" />
        <rect x={0} y={0} width={1080} height={120} fill={`rgba(230,242,255,${0.2 + 0.4 * light})`} />
        <rect x={dx0 - 40} y={top} width={22} height={bottom - top} fill="#c7a33f" />
        <rect x={dx1 + 18} y={top} width={22} height={bottom - top} fill="#c7a33f" />
        {/* folding leaves */}
        {[-1, 1].map((sd) => {
          const w = leafW * (1 - open * 0.84);
          const x0 = sd < 0 ? dx0 : dx1 - w;
          return (
            <g key={sd}>
              <rect x={x0} y={top} width={w} height={bottom - top} fill="#3c4c48" stroke="#111716" strokeWidth={6} />
              <rect x={x0 + w * 0.14} y={top + 40} width={w * 0.72} height={620} fill="#9fb8d0" opacity={0.22} />
              <rect x={x0 + w * 0.14} y={top + 720} width={w * 0.72} height={460} fill="#9fb8d0" opacity={0.16} />
            </g>
          );
        })}
        {/* steps & floor */}
        <rect x={dx0} y={bottom} width={dx1 - dx0} height={30} fill="#c7a33f" opacity={0.7} />
        <path d={`M0 ${bottom + 30} H1080 V1920 H0Z`} fill="#20252e" />
        <path d={`M${dx0} ${bottom + 30} L${dx0 - 120} 1920 M${dx1} ${bottom + 30} L${dx1 + 120} 1920`} stroke="#11151b" strokeWidth={6} />
      </svg>
    </AbsoluteFill>
  );
};
