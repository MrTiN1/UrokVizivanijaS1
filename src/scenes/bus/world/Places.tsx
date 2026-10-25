// Locations: college entrance, bus shelter with the «УЛИЦА ЛЕСНАЯ» sign and
// a city billboard (non-commercial poster), and the moving view through a
// bus window (parallax layers + a landmark stop that can pass repeatedly).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {rand} from '../../../animation/core';
import {BuildingRow, NightSky, PAL, StreetLamp, blocks, lampHead} from './City';
import {Glow, RainOnGlass} from '../../../effects/Weather';

/** College facade at night: brick-grey block, lit windows, sign, glass doors. Origin: ground line y. */
export const CollegeFacade: React.FC<{y: number; door?: number; light?: number}> = ({y, door = 0, light = 1}) => {
  const top = y - 1180;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="cf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2232" />
          <stop offset="1" stopColor="#2b2a33" />
        </linearGradient>
        <linearGradient id="cf-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" />
          <stop offset="1" stopColor="#e9a861" />
        </linearGradient>
      </defs>
      <rect x={-100} y={top} width={1280} height={1180} fill="url(#cf-wall)" />
      {/* brick courses */}
      {Array.from({length: 40}).map((_, i) => (
        <line key={i} x1={-100} y1={top + i * 30} x2={1180} y2={top + i * 30} stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
      ))}
      {/* windows: 3 floors */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((c) => {
          const wx = 30 + c * 215;
          const wy = top + 60 + r * 250;
          const on = rand(r * 7 + c * 3) > (r === 2 ? 0.75 : 0.45);
          return (
            <g key={`${r}${c}`}>
              <rect x={wx} y={wy} width={150} height={170} fill={on ? '#f2b866' : '#121826'} opacity={on ? 0.85 * light : 1} />
              <rect x={wx} y={wy} width={150} height={170} fill="none" stroke="#0d0f15" strokeWidth={8} />
              <line x1={wx + 75} y1={wy} x2={wx + 75} y2={wy + 170} stroke="#0d0f15" strokeWidth={6} />
              {on ? <rect x={wx + 10} y={wy + 10} width={55} height={150} fill="#fff1d2" opacity={0.25} /> : null}
            </g>
          );
        }),
      )}
      {/* canopy + sign */}
      <rect x={270} y={y - 420} width={540} height={40} fill="#14171f" />
      <rect x={300} y={y - 520} width={480} height={86} rx={8} fill="#0f1218" stroke="#2c3240" strokeWidth={3} />
      <text x={540} y={y - 458} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={56} letterSpacing={8} fill="#ffe2ad" style={{filter: 'drop-shadow(0 0 10px #ffb85a)'}}>
        КОЛЛЕДЖ
      </text>
      {/* entrance */}
      <rect x={380} y={y - 380} width={320} height={380} fill="url(#cf-door)" opacity={light} />
      <rect x={380 - 160 * door} y={y - 380} width={160} height={380} fill="#0e1117" opacity={0.25} stroke="#0b0d12" strokeWidth={8} />
      <rect x={540 + 160 * door} y={y - 380} width={160} height={380} fill="#0e1117" opacity={0.25} stroke="#0b0d12" strokeWidth={8} />
      <rect x={370} y={y - 390} width={340} height={14} fill="#0b0d12" />
      {/* steps */}
      <rect x={330} y={y - 6} width={420} height={18} fill="#2c313c" />
      <rect x={300} y={y + 12} width={480} height={18} fill="#242934" />
    </svg>
  );
};

/** Glass bus shelter. Origin: centre on the ground line. */
export const BusShelter: React.FC<{x: number; y: number; scale?: number; light?: number}> = ({x, y, scale = 1, light = 1}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* back glass */}
      <rect x={-330} y={-560} width={660} height={520} fill="#9fb8d0" opacity={0.16} stroke="#4a5568" strokeWidth={12} />
      <line x1={-110} y1={-560} x2={-110} y2={-40} stroke="#2c3442" strokeWidth={8} />
      <line x1={110} y1={-560} x2={110} y2={-40} stroke="#2c3442" strokeWidth={8} />
      {/* lit schedule panel (no ads) */}
      <rect x={130} y={-480} width={180} height={300} rx={6} fill="#dfe9f4" opacity={0.25 + 0.6 * light} />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={150} y={-450 + i * 36} width={i % 2 ? 110 : 140} height={10} fill="#33404f" opacity={0.6} />
      ))}
      <text x={220} y={-200} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={30} fill="#33404f">
        13 · 21 · 47
      </text>
      {/* roof */}
      <path d="M-370 -600 L370 -600 L350 -560 L-350 -560Z" fill="#3a4454" />
      <rect x={-340} y={-570} width={680} height={10} fill="#e9f2ff" opacity={0.3 + 0.6 * light} />
      {/* bench */}
      <rect x={-260} y={-200} width={360} height={22} rx={6} fill="#4a3b2c" />
      <rect x={-240} y={-178} width={12} height={138} fill="#1a1d22" />
      <rect x={70} y={-178} width={12} height={138} fill="#1a1d22" />
      {/* posts */}
      <rect x={-340} y={-600} width={16} height={560} fill="#3a4454" />
      <rect x={324} y={-600} width={16} height={560} fill="#3a4454" />
      {/* bin */}
      <rect x={-420} y={-140} width={60} height={100} rx={10} fill="#2a3a36" />
    </g>
  </svg>
);

/** Stop name sign on a pole: «УЛИЦА ЛЕСНАЯ». Origin: pole base. */
export const StopSign: React.FC<{x: number; y: number; scale?: number; light?: number; name?: string}> = ({x, y, scale = 1, light = 1, name = 'УЛИЦА ЛЕСНАЯ'}) => {
  const [a, b] = name.split(' ');
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <rect x={-8} y={-820} width={16} height={820} fill="#1b2029" />
        <rect x={-150} y={-820} width={300} height={170} rx={10} fill="#16314f" stroke="#c7d3e0" strokeWidth={5} />
        <rect x={-150} y={-820} width={300} height={170} rx={10} fill="#dfe9f4" opacity={0.12 * light} />
        <text x={0} y={-752} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={50} fill="#f2f6fb" letterSpacing={3}>
          {a}
        </text>
        <text x={0} y={-688} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={58} fill="#f2f6fb" letterSpacing={3}>
          {b}
        </text>
        <circle cx={0} cy={-600} r={40} fill="#e8edf3" stroke="#16314f" strokeWidth={6} />
        <text x={0} y={-584} textAnchor="middle" fontFamily="Russo One" fontSize={44} fill="#16314f">
          A
        </text>
      </g>
    </svg>
  );
};

/** City billboard with a non-commercial poster (pine forest & moon, no brands). */
export const Billboard: React.FC<{x: number; y: number; scale?: number; light?: number}> = ({x, y, scale = 1, light = 1}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    <defs>
      <linearGradient id="bb-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#24395a" />
        <stop offset="1" stopColor="#6a8fa8" />
      </linearGradient>
    </defs>
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-10} y={-700} width={20} height={700} fill="#1b2029" />
      <rect x={-260} y={-1060} width={520} height={360} fill="url(#bb-sky)" stroke="#0e1117" strokeWidth={12} />
      <circle cx={140} cy={-980} r={34} fill="#f3ead2" />
      {Array.from({length: 9}).map((_, i) => {
        const px = -240 + i * 60;
        const h = 120 + (i % 3) * 40;
        return <path key={i} d={`M${px} -700 L${px + 28} ${-700 - h} L${px + 56} -700Z`} fill="#18322c" />;
      })}
      <text x={0} y={-750} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={40} letterSpacing={6} fill="#f2f6fb">
        БЕРЕГИТЕ ЛЕС
      </text>
      <rect x={-260} y={-1060} width={520} height={360} fill="#fff" opacity={0.1 * light} />
      <rect x={-250} y={-1080} width={500} height={10} fill="#e9f2ff" opacity={0.4 * light} />
    </g>
  </svg>
);

export type WindowViewProps = {
  t: number; // seconds (scene-local) for scrolling
  speed?: number; // px per second at the lamp layer
  passes?: number[]; // scene seconds when the landmark stop is centred in the window
  w?: number;
  h?: number;
  drops?: boolean;
};

/**
 * View through a bus window while driving: sky, far blocks, lamps, near
 * poles; the «УЛИЦА ЛЕСНАЯ» stop + billboard pass at `passes` times, always
 * identical (that's the loop). Draw inside a container of size w × h.
 */
export const WindowView: React.FC<WindowViewProps> = ({t, speed = 900, passes = [], w = 1080, h = 1920, drops = true}) => {
  const far = blocks(4, 30, -400, 6000, 300, 820);
  const near = blocks(9, 30, -400, 6000, 500, 1200);
  const base = h * 0.72;
  const scroll = t * speed;
  const wrap = (x: number, period: number) => ((x % period) + period) % period;
  const lampXs = Array.from({length: 4}).map((_, i) => wrap(i * 520 - scroll, 2080) - 300);
  // landmark position: centred at pass time, moving left at `speed`
  const lm = passes.map((p) => w / 2 - (t - p) * speed).find((x) => x > -900 && x < w + 900);
  return (
    <AbsoluteFill style={{width: w, height: h, overflow: 'hidden'}}>
      <NightSky horizon={base} id="wv-sky" />
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-wrap(scroll * 0.12, 2400)}px)`}}>
        <BuildingRow base={base - 40} blds={far} color={PAL.bldFar} lit={0.3} winScale={0.7} haze={0.25} />
      </div>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-wrap(scroll * 0.35, 3000)}px)`}}>
        <BuildingRow base={base} blds={near} color={PAL.bld} lit={0.4} />
      </div>
      {/* road surface below */}
      <div style={{position: 'absolute', left: 0, top: base, width: w, height: h - base, background: 'linear-gradient(#1b2234,#0b0e16)'}} />
      {lm !== undefined ? (
        <>
          <Billboard x={lm + 380} y={base + 40} scale={0.9} />
          <BusShelter x={lm - 60} y={base + 60} scale={0.85} />
          <StopSign x={lm - 400} y={base + 70} scale={0.9} />
        </>
      ) : null}
      {lampXs.map((lx, i) => (
        <React.Fragment key={i}>
          <StreetLamp x={lx} base={base + 60} h={700} dir={1} />
          <Glow x={lampHead(lx, base + 60, 700).x} y={lampHead(lx, base + 60, 700).y} r={230} color={PAL.warm} intensity={0.85} core="#fff3d6" />
        </React.Fragment>
      ))}
      {/* motion-blurred near poles */}
      {Array.from({length: 2}).map((_, i) => {
        const px = wrap(i * 900 - scroll * 1.8, 1800) - 200;
        return <div key={i} style={{position: 'absolute', left: px, top: 0, width: 70, height: h, background: 'linear-gradient(90deg,transparent,#06080c 40%,#06080c 60%,transparent)', opacity: 0.85, filter: 'blur(8px)'}} />;
      })}
      {drops ? <RainOnGlass w={w} h={h} density={1.4} seed={7} /> : null}
    </AbsoluteFill>
  );
};

export const useT = () => useCurrentFrame() / 30;
