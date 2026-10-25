// Scene 3 — the stop (0:23–0:38): empty shelter, flickering lamp, an old
// bus «13» emerges from the dark, doors open, Gleb gets in, the driver stares.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {BuildingRow, NightSky, PAL, StreetLamp, blocks, lampHead} from './world/City';
import {BusShelter, StopSign} from './world/Places';
import {BusFront, BusSide, busHeadlights} from './world/Bus';
import {Glow, LightCone, Mist, Rain, Splashes, WetReflections, flicker} from '../../effects/Weather';
import {DRIVER, GLEB_CIVIL} from '../../characters/designs';
import {Act, L_BUS, L_STREET, Post, dim, frozen, glebPose, seatedPose} from './common';
import {DriverCabShot} from './shots';
import {pose, withExpr} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {ev, evArr} from '../../data';

const S = 's3_stop';

export const LbStop: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const fl = flicker(t, evArr(S, 'flicker') as unknown as number[][], 9);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 8.2 ? <Wide f={f} t={t} fl={fl} /> : t < 11.2 ? <Doors f={f} t={t} /> : <DriverStare f={f} t={t} />}
      <Post warm={0.06} />
    </AbsoluteFill>
  );
};

const Ground: React.FC<{sidewalk: number; curb: number}> = ({sidewalk, curb}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="s3road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b2133" />
        <stop offset="1" stopColor="#0a0d14" />
      </linearGradient>
    </defs>
    <rect x={-200} y={sidewalk} width={1480} height={curb - sidewalk} fill="#1f2531" />
    <rect x={-200} y={curb} width={1480} height={18} fill="#2c3340" />
    <rect x={-200} y={curb + 18} width={1480} height={1920} fill="url(#s3road)" />
    {Array.from({length: 6}).map((_, i) => (
      <rect key={i} x={-150 + i * 260} y={curb + 230} width={150} height={10} fill="#c8c3b4" opacity={0.2} />
    ))}
    {[[300, curb + 120, 200], [820, curb + 300, 260]].map(([x, y, r], i) => (
      <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.15} fill="#2c3854" opacity={0.5} />
    ))}
  </svg>
);

const Wide: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const sidewalk = 1330;
  const curb = 1470;
  const lamp = lampHead(170, sidewalk + 40, 980, 1);
  // Gleb walks into the shelter
  const k = clamp((t - 0.3) / 2.3);
  const gx = lerp(-80, 600, ease.out(k));
  const walking = t < 2.6;
  const cyc = walk(t * 0.95, walking ? 0.9 * (1 - k * 0.6) : 0);
  const lookLeft = ramp(t, 3.0, 3.6);
  let g = pose({bodyTurn: lerp(0.9, 0.2, ramp(t, 2.2, 3.0)), headTurn: lerp(0.9, -0.85, lookLeft), lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR});
  g = glebPose(f, g, t > 4.5 ? 'interest' : 'neutral', 7);
  // bus approach
  const b = clamp((t - ev(S, 'busArrive')) / (ev(S, 'busStop') - ev(S, 'busArrive')));
  const be = ease.out(b);
  const busOn = t > ev(S, 'busArrive') - 0.4;
  const bx = lerp(150, 470, be);
  const by = lerp(curb - 120, 1800, be);
  const bs = lerp(0.1, 0.78, be ** 1.3);
  const hl = busHeadlights(bx, by, bs);
  const appear = clamp((t - (ev(S, 'busArrive') - 0.4)) / 0.8);
  const cam = {x: -40 * ramp(t, 4.0, 7.6) + fbm(f / 50, 1) * 4, y: 0, zoom: 1.0 + 0.04 * ramp(t, 0, 8), rot: 0, shake: be > 0.95 && t < ev(S, 'busStop') + 0.4 ? 3 : 0};
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.4}>
        <NightSky horizon={1000} id="s3sky" />
        <BuildingRow base={1150} blds={blocks(21, 14, -300, 1500, 300, 760)} color={PAL.bldFar} lit={0.22} winScale={0.7} haze={0.35} />
      </Layer>
      <Layer depth={0.8}>
        <BuildingRow base={sidewalk} blds={blocks(22, 14, -300, 1500, 450, 900)} color={PAL.bld} lit={0.3} />
      </Layer>
      <Layer depth={1}>
        <Ground sidewalk={sidewalk} curb={curb} />
        <WetReflections
          ground={curb}
          lights={[
            {x: lamp.x, y: lamp.y, color: PAL.warm, size: 70, intensity: fl},
            {x: 760, y: 900, color: '#dfe9f4', size: 90, intensity: 0.6},
            ...(busOn ? hl.map((h) => ({x: h.x, y: h.y - 200 * bs, color: '#fff2d0', size: 120 * bs + 20, intensity: appear})) : []),
          ]}
          depth={700}
        />
        <BusShelter x={720} y={sidewalk + 70} scale={0.95} light={0.9} />
        <StopSign x={930} y={sidewalk + 80} scale={0.8} name="ПРОСПЕКТ МИРА" />
        <StreetLamp x={170} base={sidewalk + 40} h={980} dir={1} on={fl} />
        <Glow x={lamp.x} y={lamp.y} r={300} color={PAL.warm} core="#fff3d6" intensity={fl} />
        <LightCone x={lamp.x} y={lamp.y} w0={30} w1={620} h={1160} intensity={0.75 * fl} seed={31} />
        <Act d={GLEB_CIVIL} p={g} x={gx} y={sidewalk + 110 - 430 * 0.62} s={0.62} id="s3g" light={dim(L_STREET, 0.6 + 0.4 * fl)} />
        <Mist y={curb - 60} height={420} color="130,145,190" opacity={0.16} />
        {busOn ? (
          <>
            <div style={{position: 'absolute', inset: 0, opacity: appear}}>
              <BusFront x={bx} y={by} scale={bs} lights={1} />
            </div>
            {hl.map((h, i) => (
              <Glow key={i} x={h.x} y={h.y} r={60 + 900 * bs} color="#fff3d6" core="#ffffff" intensity={appear * (0.7 + 0.3 * be)} />
            ))}
          </>
        ) : null}
        <Splashes y0={curb + 30} y1={1920} count={60} />
      </Layer>
      <Layer depth={1.3}>
        <Rain count={120} seed={31} angle={8} speed={42} length={60} width={1.3} opacity={0.24} />
        <Rain count={50} seed={32} angle={10} speed={66} length={130} width={2.6} opacity={0.3} blur={1.5} />
      </Layer>
    </CameraRig>
  );
};

const Doors: React.FC<{f: number; t: number}> = ({f, t}) => {
  const door = ramp(t, ev(S, 'doorsOpen'), ev(S, 'doorsOpen') + 0.7, ease.out);
  const ground = 1560;
  const k = clamp((t - ev(S, 'enter')) / 1.4);
  const gx = lerp(900, 560, ease.inOut(k));
  const gs = lerp(0.85, 0.72, k);
  const cyc = walk((t - 8.2) * 0.95, t > ev(S, 'enter') && k < 1 ? 0.9 : 0.1);
  let g = pose({bodyTurn: lerp(-0.9, -2.6, ramp(k, 0.55, 1)), headTurn: lerp(-0.9, -2.4, ramp(k, 0.5, 1)), lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR});
  g = glebPose(f, g, 'doubt', 7);
  const fade = 1 - ramp(k, 0.85, 1);
  const cam = {x: -30 * ramp(t, 8.2, 11.2), y: 0, zoom: 1.04 + 0.04 * ramp(t, 8.2, 11.2), rot: 0, shake: 0};
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5}>
        <NightSky horizon={900} id="s3dsky" />
        <BuildingRow base={1100} blds={blocks(25, 14, -300, 1500, 400, 900)} lit={0.3} haze={0.2} />
      </Layer>
      <Layer depth={1}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <rect x={-200} y={ground} width={1480} height={400} fill="#1f2531" />
          <rect x={-200} y={ground + 40} width={1480} height={1920} fill="#151a24" />
        </svg>
        {/* cold interior light spilling out of the door onto the wet pavement */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
          <defs>
            <linearGradient id="s3spill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dfeaff" stopOpacity={0.5 * door} />
              <stop offset="1" stopColor="#dfeaff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`M${540 - 72} ${ground - 20} L${540 + 72} ${ground - 20} L${540 + 260} 1920 L${540 - 260} 1920Z`} fill="url(#s3spill)" />
        </svg>
        <BusSide x={540} y={ground} scale={0.76} door={door} />
        {fade > 0.01 ? <Act d={GLEB_CIVIL} p={g} x={gx} y={ground + 40 - 430 * gs} s={gs} id="s3dg" light={L_BUS} opacity={fade} /> : null}
        <Splashes y0={ground + 20} y1={1920} count={40} />
        <Mist y={ground} height={300} color="150,165,200" opacity={0.12} />
      </Layer>
      <Layer depth={1.3}>
        <Rain count={110} seed={33} angle={8} speed={42} length={60} width={1.3} opacity={0.24} />
        <Rain count={40} seed={34} angle={10} speed={66} length={130} width={2.6} opacity={0.28} blur={1.5} />
      </Layer>
    </CameraRig>
  );
};

export const driverPose = (f: number, headTurn: number, extra: Partial<ReturnType<typeof seatedPose>> = {}) =>
  frozen(
    withExpr(
      seatedPose(-0.55, {
        headTurn,
        eyeX: 0,
        headNod: 0.08,
        armL: {shoulder: 40, elbow: 60, wrist: 0, hand: 'hold'},
        armR: {shoulder: 44, elbow: 56, wrist: 0, hand: 'hold'},
        ...extra,
      }),
      'stern',
      0.9,
    ),
  );

const DriverStare: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 11.2;
  const push = ease.cam(clamp(lt / 3.8));
  const p = {...driverPose(f, 0.15), lidDrop: 0.3, pupil: 0.85};
  return (
    <DriverCabShot
      f={f}
      clock="23:51"
      cam={{x: -60 * push, y: -320 * push, zoom: 1.0 + 0.5 * push, rot: 0, shake: 0}}
      driver={{d: DRIVER, p, x: 470, y: 1500, s: 1.45, id: 's3drv', light: dim(L_BUS, 0.7)}}
    />
  );
};
