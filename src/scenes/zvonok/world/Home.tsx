// «Звонок от себя» — Artyom's rented flat at night: the room (desk, monitor,
// warm lamp, rainy window), the hallway to the front door, the door close-up
// with peephole and chain, the fisheye view onto the stairwell, desk clock.
// Built on the shared kit (WindowView, RainOnGlass, Glow, LightCone, Bokeh).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character} from '../../../characters/Character';
import {Design, Light, Pose} from '../../../characters/types';
import {MouthParams} from '../../../characters/Head';
import {WindowView} from '../../bus/world/Places';
import {Glow, LightCone, RainOnGlass} from '../../../effects/Weather';
import {noise, rand} from '../../../animation/core';

export const L_LAMP: Light = {x: -0.7, y: -0.5, rim: '#ffc98a', rimStrength: 0.7, shade: '#1b1d33', shadeStrength: 0.55};
export const L_MONITOR: Light = {x: 0.6, y: -0.1, rim: '#9ec4ff', rimStrength: 0.75, shade: '#15192e', shadeStrength: 0.55};
export const L_HALL: Light = {x: 0.1, y: -0.9, rim: '#ffd29a', rimStrength: 0.55, shade: '#1d1a26', shadeStrength: 0.55};
export const L_STAIR: Light = {x: -0.2, y: -0.9, rim: '#cfe6d8', rimStrength: 0.5, shade: '#16201d', shadeStrength: 0.6};

const svgStyle: React.CSSProperties = {position: 'absolute', inset: 0, overflow: 'visible'};

/** Monitor screen content: dark editor with lines, a video player tab, clock in the taskbar. */
const ScreenContent: React.FC<{w: number; h: number; clock: string; seed?: number}> = ({w, h, clock, seed = 1}) => {
  const f = useCurrentFrame();
  const lines = Array.from({length: 14}).map((_, i) => ({w: 0.2 + rand(i * 3.1 + seed) * 0.5, c: ['#7fb6ff', '#c792ea', '#9ad18b', '#e0e0e0'][i % 4], indent: (i % 3) * 0.04}));
  const cursor = Math.floor(f / 15) % 2;
  return (
    <g>
      <rect width={w} height={h} fill="#0d1424" />
      <rect width={w} height={h * 0.06} fill="#1a2238" />
      {lines.map((l, i) => (
        <rect key={i} x={w * (0.05 + l.indent)} y={h * (0.1 + i * 0.055)} width={w * l.w} height={h * 0.022} rx={2} fill={l.c} opacity={0.7} />
      ))}
      <rect x={w * 0.05 + w * 0.32} y={h * (0.1 + 13 * 0.055)} width={w * 0.012} height={h * 0.03} fill="#fff" opacity={cursor} />
      <rect x={w * 0.62} y={h * 0.1} width={w * 0.33} height={h * 0.38} fill="#1b2a44" />
      <path d={`M${w * 0.76} ${h * 0.24} l${w * 0.05} ${h * 0.05} l${-w * 0.05} ${h * 0.05}Z`} fill="#9ec4ff" opacity={0.8} />
      <rect y={h * 0.93} width={w} height={h * 0.07} fill="#0a0f1a" />
      <text x={w * 0.97} y={h * 0.985} textAnchor="end" fontFamily="Montserrat" fontWeight={700} fontSize={h * 0.045} fill="#dfe8f5">
        {clock}
      </text>
    </g>
  );
};

/**
 * The room, front view (camera by the bed looking at desk and window).
 * Returns the background; the character is placed by the scene between
 * `RoomBack` and `RoomFront` (chair back / desk edge in front of him).
 */
export const RoomBack: React.FC<{clock?: string; lamp?: number; screen?: number; t: number}> = ({clock = '23:58', lamp = 1, screen = 1, t}) => (
  <AbsoluteFill style={{background: '#11141f'}}>
    <svg width={1080} height={1920} style={svgStyle}>
      <defs>
        <linearGradient id="rm-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2133" />
          <stop offset="1" stopColor="#262a3a" />
        </linearGradient>
        <pattern id="rm-paper" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M30 6 l6 12 l-6 12 l-6 -12Z" fill="#2c3246" opacity={0.5} />
        </pattern>
        <linearGradient id="rm-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2c22" />
          <stop offset="1" stopColor="#1a130f" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1440} fill="url(#rm-wall)" />
      <rect width={1080} height={1440} fill="url(#rm-paper)" />
      {/* floor with boards */}
      <rect y={1440} width={1080} height={480} fill="url(#rm-floor)" />
      {Array.from({length: 9}).map((_, i) => (
        <line key={i} x1={i * 150 - 200} y1={1440} x2={i * 230 - 520} y2={1920} stroke="#120d0a" strokeWidth={3} opacity={0.6} />
      ))}
      <rect y={1430} width={1080} height={16} fill="#2a2f40" />
      {/* poster (abstract, no brands) */}
      <rect x={70} y={300} width={230} height={320} fill="#2b3a52" stroke="#11141c" strokeWidth={8} />
      <circle cx={185} cy={420} r={70} fill="#c66b4a" opacity={0.7} />
      <path d="M90 600 L185 480 L280 600Z" fill="#1c2638" />
      {/* shelf with books */}
      <rect x={60} y={720} width={340} height={14} fill="#4a3628" />
      {Array.from({length: 9}).map((_, i) => (
        <rect key={i} x={72 + i * 34} y={720 - (70 + (i % 3) * 18)} width={28} height={70 + (i % 3) * 18} fill={['#6b3b3b', '#2f4a5e', '#5e5a3a', '#3b2f4e'][i % 4]} />
      ))}
    </svg>
    {/* window with the rainy city */}
    <div style={{position: 'absolute', left: 600, top: 260, width: 420, height: 620, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -330, top: -260, width: 1080, height: 1920, transform: 'scale(0.9)', transformOrigin: '0 0'}}>
        <WindowView t={3 + t * 0.02} speed={0} w={1080} h={1500} drops={false} />
      </div>
      <RainOnGlass w={420} h={620} density={2.2} seed={9} />
    </div>
    <svg width={1080} height={1920} style={svgStyle}>
      <rect x={600} y={260} width={420} height={620} fill="none" stroke="#e1e4ea" strokeWidth={14} />
      <line x1={810} y1={260} x2={810} y2={880} stroke="#e1e4ea" strokeWidth={10} />
      <rect x={580} y={880} width={460} height={22} fill="#d5d8de" />
      {/* curtain */}
      <path d="M560 220 Q600 600 570 920 L520 920 Q540 560 520 220Z" fill="#4b3a5c" />
      <rect x={500} y={210} width={560} height={14} fill="#1c1f28" />
      {/* desk */}
      <rect x={40} y={1180} width={760} height={26} fill="#5a4231" />
      <rect x={60} y={1206} width={20} height={240} fill="#2e231b" />
      <rect x={760} y={1206} width={20} height={240} fill="#2e231b" />
      {/* monitor */}
      <rect x={210} y={830} width={440} height={280} rx={10} fill="#07090e" />
      <rect x={410} y={1110} width={40} height={60} fill="#111" />
      <rect x={350} y={1166} width={160} height={16} rx={4} fill="#111" />
      {/* keyboard, mouse, mug */}
      <rect x={260} y={1150} width={300} height={26} rx={6} fill="#1b1e25" />
      <ellipse cx={610} cy={1166} rx={22} ry={12} fill="#1b1e25" />
      <rect x={680} y={1120} width={50} height={56} rx={8} fill="#c9c2b6" />
      <path d="M730 1135 q22 6 0 24" stroke="#c9c2b6" strokeWidth={8} fill="none" />
      {/* desk lamp */}
      <path d="M120 1180 L150 1000 L220 950" stroke="#24272e" strokeWidth={10} fill="none" />
      <path d="M200 930 L262 960 L240 1000 L180 975Z" fill="#2a2e36" />
      <rect x={100} y={1170} width={70} height={12} rx={4} fill="#24272e" />
    </svg>
    <svg x={0} y={0} width={1080} height={1920} style={svgStyle}>
      <g transform="translate(218 838)">
        <ScreenContent w={424} h={264} clock={clock} />
        <rect width={424} height={264} fill="#000" opacity={1 - screen} />
      </g>
    </svg>
    <LightCone x={235} y={985} w0={40} w1={520} h={260} color="#ffc98a" intensity={0.55 * lamp} seed={61} rain={false} />
    <Glow x={235} y={985} r={260} color="#ffb867" intensity={0.6 * lamp} core="#fff1d6" />
    <Glow x={430} y={970} r={420} color="#7fa8ff" intensity={0.28 * screen} />
  </AbsoluteFill>
);

/** Office chair back (drawn over the seated character when seen from behind/side). */
export const ChairFront: React.FC<{x: number; y: number; s: number; back?: boolean}> = ({x, y, s, back}) => (
  <svg width={1080} height={1920} style={svgStyle}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {back ? <rect x={-150} y={-380} width={300} height={340} rx={50} fill="#1d2027" stroke="#0c0d10" strokeWidth={4} /> : null}
      <rect x={-140} y={-20} width={280} height={50} rx={20} fill="#23262e" />
      <rect x={-10} y={30} width={20} height={200} fill="#111" />
      <path d="M-150 250 L150 250" stroke="#111" strokeWidth={14} strokeLinecap="round" />
    </g>
  </svg>
);

/** Desk alarm clock with big digits (the «23:59», «00:00» close-ups). */
export const DeskClock: React.FC<{time: string; blink?: boolean}> = ({time, blink}) => {
  const f = useCurrentFrame();
  const colonOn = !blink || Math.floor(f / 15) % 2 === 0;
  const [hh, mm] = time.split(':');
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #2a1a1a, #07080c 70%)'}}>
      <svg width={1080} height={1920} style={svgStyle}>
        <rect x={140} y={720} width={800} height={420} rx={60} fill="#101114" stroke="#26282f" strokeWidth={8} />
        <rect x={190} y={780} width={700} height={300} rx={24} fill="#1a0b0b" />
        <text x={540} y={1010} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={230} letterSpacing={10} fill="#ff4a3a">
          {hh}
          <tspan opacity={colonOn ? 1 : 0.15}>:</tspan>
          {mm}
        </text>
        <rect x={140} y={1140} width={800} height={30} fill="#000" opacity={0.4} />
        <rect x={0} y={1170} width={1080} height={750} fill="#2b2019" />
      </svg>
      <Glow x={540} y={930} r={520} color="#ff4a3a" intensity={0.35} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- hallway
/** Narrow hallway in one-point perspective towards the front door. */
export const HallwayBack: React.FC<{lamp?: number; doorGlow?: number}> = ({lamp = 1, doorGlow = 0}) => {
  const vx = 540;
  const vy = 860;
  // door rectangle at the far end
  const d = {x: 400, y: 560, w: 280, h: 640};
  return (
    <AbsoluteFill style={{background: '#0b0c12'}}>
      <svg width={1080} height={1920} style={svgStyle}>
        <defs>
          <linearGradient id="hw-wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2a2630" />
            <stop offset="1" stopColor="#3a3340" />
          </linearGradient>
          <linearGradient id="hw-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a2e26" />
            <stop offset="1" stopColor="#140f0c" />
          </linearGradient>
          <radialGradient id="hw-lamp" cx="0.5" cy="0" r="0.9">
            <stop offset="0" stopColor="#ffd29a" stopOpacity={0.45 * lamp} />
            <stop offset="1" stopColor="#ffd29a" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* walls, ceiling, floor */}
        <path d={`M0 0 L${d.x} ${d.y} L${d.x} ${d.y + d.h} L0 1920Z`} fill="url(#hw-wall)" />
        <path d={`M1080 0 L${d.x + d.w} ${d.y} L${d.x + d.w} ${d.y + d.h} L1080 1920Z`} fill="#2e2a34" />
        <path d={`M0 0 L1080 0 L${d.x + d.w} ${d.y} L${d.x} ${d.y}Z`} fill="#1f1d26" />
        <path d={`M0 1920 L1080 1920 L${d.x + d.w} ${d.y + d.h} L${d.x} ${d.y + d.h}Z`} fill="url(#hw-floor)" />
        {Array.from({length: 8}).map((_, i) => {
          const k = (i + 1) / 9;
          const y = d.y + d.h + (1920 - d.y - d.h) * k * k;
          const x0 = d.x - (d.x) * k * k;
          const x1 = d.x + d.w + (1080 - d.x - d.w) * k * k;
          return <line key={i} x1={x0} y1={y} x2={x1} y2={y} stroke="#0d0907" strokeWidth={2 + k * 3} opacity={0.6} />;
        })}
        {/* far wall + door */}
        <rect x={d.x - 30} y={d.y - 40} width={d.w + 60} height={d.h + 40} fill="#2c2833" />
        <rect x={d.x} y={d.y} width={d.w} height={d.h} fill="#4a3426" stroke="#1a120c" strokeWidth={8} />
        <rect x={d.x + 30} y={d.y + 40} width={d.w - 60} height={d.h * 0.4} fill="none" stroke="#3a281d" strokeWidth={6} />
        <rect x={d.x + 30} y={d.y + d.h * 0.5} width={d.w - 60} height={d.h * 0.42} fill="none" stroke="#3a281d" strokeWidth={6} />
        <circle cx={d.x + d.w / 2} cy={d.y + 190} r={8} fill="#c7a052" />
        <rect x={d.x + d.w - 46} y={d.y + d.h * 0.48} width={22} height={60} rx={6} fill="#b89448" />
        <path d={`M${d.x + d.w - 40} ${d.y + d.h * 0.43} q-30 20 -10 40`} stroke="#9a8c78" strokeWidth={4} fill="none" />
        <rect x={d.x} y={d.y + d.h - 6} width={d.w} height={6} fill="#ffd29a" opacity={0.15 + 0.5 * doorGlow} />
        {/* coat hooks with a jacket, shoe rack */}
        <rect x={110} y={520} width={200} height={14} fill="#4a3628" transform={`skewY(${-18})`} />
        <path d="M150 560 Q130 700 160 860 L250 840 Q270 690 230 540Z" fill="#20232a" />
        <rect x={720} y={1300} width={240} height={110} fill="#2a2018" transform={`skewY(${14})`} />
        <ellipse cx={780} cy={1500} rx={60} ry={18} fill="#d9d6cf" />
        <ellipse cx={880} cy={1520} rx={60} ry={18} fill="#d9d6cf" />
        {/* ceiling lamp */}
        <ellipse cx={vx} cy={300} rx={90} ry={22} fill="#fff1d6" opacity={0.4 + 0.6 * lamp} />
        <rect x={0} y={0} width={1080} height={1920} fill="url(#hw-lamp)" />
      </svg>
      <Glow x={vx} y={300} r={420} color="#ffcf8a" intensity={0.55 * lamp} core="#fff3d6" />
      <Glow x={vx} y={vy + 400} r={300} color="#ffd29a" intensity={0.12 * lamp} />
    </AbsoluteFill>
  );
};
export const HALL_DOOR = {x: 400, y: 560, w: 280, h: 640};

/** Close-up of the inside of the front door: peephole, deadbolt, chain. */
export const DoorClose: React.FC<{chain?: boolean; locked?: boolean; light?: number}> = ({chain = true, locked = true, light = 1}) => (
  <AbsoluteFill style={{background: '#0a0b10'}}>
    <svg width={1080} height={1920} style={svgStyle}>
      <defs>
        <linearGradient id="dc2-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a281d" />
          <stop offset="0.5" stopColor="#4d3627" />
          <stop offset="1" stopColor="#33241a" />
        </linearGradient>
        <radialGradient id="dc2-lens" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#9fb4c9" />
          <stop offset="0.5" stopColor="#2a3442" />
          <stop offset="1" stopColor="#0b0e13" />
        </radialGradient>
      </defs>
      <rect x={100} y={0} width={880} height={1920} fill="url(#dc2-wood)" />
      {Array.from({length: 14}).map((_, i) => (
        <path key={i} d={`M${130 + i * 62} 0 Q${140 + i * 62 + noise(i, 1) * 20} 960 ${130 + i * 62} 1920`} stroke="#2a1d14" strokeWidth={2} fill="none" opacity={0.5} />
      ))}
      <rect x={180} y={260} width={720} height={540} fill="none" stroke="#2c1f16" strokeWidth={10} />
      {/* peephole */}
      <circle cx={540} cy={560} r={46} fill="#b89448" />
      <circle cx={540} cy={560} r={30} fill="url(#dc2-lens)" />
      <circle cx={530} cy={550} r={8} fill="#fff" opacity={0.5} />
      {/* deadbolt */}
      <rect x={760} y={980} width={80} height={140} rx={14} fill="#b89448" />
      <rect x={782} y={1020} width={36} height={60} rx={8} fill="#8a6c31" transform={locked ? 'rotate(90 800 1050)' : ''} />
      {/* chain */}
      {chain ? (
        <g>
          <rect x={900} y={860} width={80} height={30} rx={8} fill="#a9a196" />
          <rect x={620} y={880} width={70} height={26} rx={8} fill="#a9a196" />
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={i} cx={690 + i * 24} cy={892 + Math.sin(i / 2.6) * 18} rx={14} ry={8} fill="none" stroke="#c9c2b6" strokeWidth={5} />
          ))}
        </g>
      ) : null}
      {/* handle */}
      <rect x={720} y={1240} width={200} height={40} rx={20} fill="#b89448" />
      <rect x={700} y={1200} width={60} height={160} rx={16} fill="#9c7d3d" />
      <rect x={100} y={0} width={880} height={1920} fill="#000" opacity={0.35 * (1 - light)} />
    </svg>
    <Glow x={540} y={200} r={700} color="#ffcf8a" intensity={0.25 * light} />
  </AbsoluteFill>
);

/**
 * Fisheye view through the peephole onto the cold stairwell landing:
 * circular lens, strong vignette, slight barrel bulge (scaled centre), the
 * visitor in the middle.
 */
export const PeepholeView: React.FC<{figure?: {d: Design; p: Pose; mouth?: MouthParams} | null; t: number; light?: number}> = ({figure, t, light = 1}) => {
  const f = useCurrentFrame();
  const flick = light * (0.9 + 0.1 * noise(f / 5, 3));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left: 540 - 520, top: 960 - 520, width: 1040, height: 1040, borderRadius: '50%', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, transform: 'scale(1.18)', transformOrigin: '50% 50%'}}>
          <svg width={1040} height={1040} viewBox="0 0 1040 1040" style={{position: 'absolute', inset: 0}}>
            <defs>
              <radialGradient id="pv-light" cx="0.5" cy="0.15" r="0.9">
                <stop offset="0" stopColor="#dff0e6" stopOpacity={0.55 * flick} />
                <stop offset="1" stopColor="#dff0e6" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width={1040} height={1040} fill="#3a4a44" />
            {/* landing walls: two-tone paint like old stairwells */}
            <path d="M0 0 L300 260 L300 800 L0 1040Z" fill="#2f3d38" />
            <path d="M1040 0 L740 260 L740 800 L1040 1040Z" fill="#2c3934" />
            <rect x={300} y={260} width={440} height={540} fill="#46574f" />
            <rect x={300} y={600} width={440} height={200} fill="#3b2f2a" />
            <path d="M0 1040 L300 800 L740 800 L1040 1040Z" fill="#2a2523" />
            {/* stair rail going down */}
            <path d="M760 820 L1040 980" stroke="#7a6a52" strokeWidth={14} />
            {Array.from({length: 5}).map((_, i) => (
              <line key={i} x1={790 + i * 55} y1={836 + i * 31} x2={790 + i * 55} y2={940 + i * 31} stroke="#3a3a3a" strokeWidth={6} />
            ))}
            {/* wet footprints */}
            {[[480, 900], [540, 960], [500, 1010]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx={18} ry={8} fill="#8fb0c4" opacity={0.25} />
            ))}
            {/* fluorescent tube */}
            <rect x={440} y={250} width={160} height={14} rx={6} fill="#eaf6ef" opacity={0.5 + 0.5 * flick} />
            <rect width={1040} height={1040} fill="url(#pv-light)" />
            {figure ? (
              <Character design={figure.d} pose={figure.p} light={L_STAIR} x={520} y={860} scale={1.25} idp="pv-fig" mouth={figure.mouth} legs={false} />
            ) : null}
            {/* drips on the visitor from the rain */}
            {figure
              ? Array.from({length: 7}).map((_, i) => {
                  const p = ((t * 0.7 + rand(i * 3)) % 1);
                  return <line key={`dr${i}`} x1={430 + i * 30} y1={330 + p * 500} x2={430 + i * 30} y2={350 + p * 500} stroke="#cfe2f2" strokeWidth={3} opacity={0.3 * (1 - p)} />;
                })
              : null}
          </svg>
        </div>
        {/* lens vignette + glass sheen */}
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.95) 78%, #000 80%)'}} />
        <div style={{position: 'absolute', left: 160, top: 120, width: 320, height: 140, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.12), transparent 70%)'}} />
      </div>
    </AbsoluteFill>
  );
};
