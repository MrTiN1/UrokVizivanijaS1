// Scene 6 — talking to the driver (1:08–1:25). Gleb walks to the cab and
// asks twice; the driver is silent, then slowly turns his head: «Ты уже
// выходил». Music cuts out; extreme close-up of Gleb's eyes.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {AisleShot, DriverCabShot} from './shots';
import {DRIVER, GLEB_CIVIL} from '../../characters/designs';
import {Act, L_BUS, Post, dim, glebPose} from './common';
import {driverPose} from './S3Stop';
import {exprTrack, lipSync, pose} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {Black} from '../../effects/Atmosphere';
import {BOKEH_BUS, Bokeh, flicker} from '../../effects/Weather';
import {ev} from '../../data';

const S = 's6_driver';

export const LbDriver: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const fl = flicker(t, [[9.6, 10.0], [12.2, 12.5]], 13);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 2.2 ? <Walk f={f} t={t} /> : t < 6.6 ? <TwoShot f={f} t={t} fl={fl} /> : t < 9 ? <GlebAsk f={f} t={t} /> : t < ev(S, 'eyes') ? <DriverTurn f={f} t={t} fl={fl} /> : <Eyes f={f} t={t} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

const standing = (f: number, over: Parameters<typeof pose>[0], expr: Parameters<typeof glebPose>[2]) => glebPose(f, pose(over), expr, 7);

const Walk: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = clamp(t / 2.0);
  const z = lerp(1.4, 4.4, ease.inOut(k));
  const cyc = walk(t * 0.95, k < 1 ? 0.85 : 0);
  const g = standing(f, {bodyTurn: 3.7, headTurn: 3.7, lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR}, 'neutral');
  const drv = driverPose(f, 3.7, {bodyTurn: 3.7});
  return (
    <AisleShot
      facing="front"
      cam={{x: 0, y: -30 * k, zoom: 1.05 + 0.1 * k, rot: fbm(f / 40, 2) * 0.4, shake: 1.2, shakeFreq: 0.6}}
      occupants={[
        {d: DRIVER, p: drv, X: -0.62, z: 7.3, id: 'd6w'},
        {d: GLEB_CIVIL, p: g, X: 0.02, z, Y: 0.373, id: 'g6w'},
      ]}
    />
  );
};

const TwoShot: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const ls = lipSync(S, 's6_g1', f);
  const lt = t - 2.2;
  const e = exprTrack(Math.round(lt * 30), [
    [0, 'interest'],
    [50, 'doubt', 20],
  ]);
  const g = standing(f, {bodyTurn: -0.75, headTurn: -0.8, eyeX: -0.3, armR: {shoulder: 28, elbow: 40, wrist: 0, hand: 'open'}, armL: {shoulder: 6, elbow: 14, wrist: 0, hand: 'relaxed'}}, e);
  const drv = driverPose(f, -0.95);
  const k = ease.cam(clamp(lt / 4.4));
  return (
    <DriverCabShot
      f={f}
      light={fl}
      clock="00:09"
      cam={{x: 60 + 30 * k, y: -60, zoom: 1.05 + 0.05 * k, rot: 0, shake: 0}}
      driver={{d: DRIVER, p: drv, x: 380, y: 1500, s: 1.35, id: 'd6t', light: dim(L_BUS, 0.6 + 0.4 * fl)}}
      extra={<Act d={GLEB_CIVIL} p={g} x={930} y={1560} s={1.55} id="g6t" light={dim(L_BUS, 0.6 + 0.4 * fl)} mouth={ls.talking ? ls.mouth : undefined} legs={false} />}
    />
  );
};

const GlebAsk: React.FC<{f: number; t: number}> = ({f, t}) => {
  const ls = lipSync(S, 's6_g2', f);
  const lt = t - 6.6;
  const g = standing(f, {bodyTurn: -0.6, headTurn: -0.65, eyeX: -0.4, headNod: 0.05}, 'anxiety');
  const k = ease.cam(clamp(lt / 2.4));
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + 0.05 * k, rot: 0, shake: 0.8, shakeFreq: 0.5}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_BUS} top="#1a2234" bottom="#07080c" />
      </Layer>
      <Layer depth={1}>
        <Act d={GLEB_CIVIL} p={g} x={600} y={2050} s={2.6} id="g6a" light={L_BUS} mouth={ls.talking ? ls.mouth : undefined} legs={false} />
      </Layer>
    </CameraRig>
  );
};

const DriverTurn: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const turn = ease.inOut(clamp((t - ev(S, 'headTurn')) / 1.3));
  const ls = lipSync(S, 's6_d1', f);
  const p = {...driverPose(f, lerp(-0.95, 0.08, turn), {eyeX: lerp(-0.6, 0, turn)}), lidDrop: 0.32, pupil: 0.8};
  const lt = t - 9;
  const k = ease.cam(clamp(lt / 3.3));
  return (
    <DriverCabShot
      f={f}
      light={fl}
      clock="00:10"
      cam={{x: (470 - 540) * (1.8 + 0.3 * k), y: (900 - 960) * (1.8 + 0.3 * k), zoom: 1.8 + 0.3 * k, rot: 0, shake: 0}}
      driver={{d: DRIVER, p, x: 470, y: 1500, s: 1.45, id: 'd6d', light: dim(L_BUS, 0.5 + 0.5 * fl), mouth: ls.talking ? ls.mouth : undefined}}
    />
  );
};

const Eyes: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'eyes');
  const push = ease.cam(clamp(lt / 4.7));
  let g = pose({bodyTurn: 0, headTurn: 0.02, eyeX: -0.05, eyeY: -0.02});
  g = glebPose(f, g, 'fear', 7);
  g = {...g, pupil: lerp(0.9, 0.58, ramp(lt, 0.2, 1.4)), blink: lt < 2.5 ? 0 : g.blink};
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + 0.15 * push, rot: 0, shake: 0.6, shakeFreq: 0.4}}>
      <Layer depth={1}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #1d2336, #05060a 70%)'}} />
        <Act d={GLEB_CIVIL} p={g} x={540} y={960 + 436 * 6.2 - 70 * 6.2} s={6.2} id="g6e" light={dim(L_BUS, 0.7)} legs={false} />
      </Layer>
      <Black amount={ramp(lt, 4.3, 4.7) * 0.6} />
    </CameraRig>
  );
};
