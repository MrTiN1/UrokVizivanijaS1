// Ep2 Scene 3 — passengers (0:23–0:38): Gleb shouts at the motionless
// passengers; silence; the woman slowly lifts her head: «Глеб… Не смотри в
// заднее окно». He never told anyone his name.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AisleShot} from '../bus/shots';
import {GlebStandClose, RearAisle, glebStand, womanCam, womanPose} from './common2';
import {BACK_PASSENGERS, GLEB_CIVIL, OLD_WOMAN} from '../../characters/designs';
import {Post, frozen, seatedPose} from '../bus/common';
import {SEATING, camOn, facePoint} from '../bus/S4Passengers';
import {exprTrack, lipSync, withExpr} from '../../animation/performance';
import {clamp, ease, lerp, ramp} from '../../animation/core';
import {flicker} from '../../effects/Weather';
import {ev} from '../../data';

const S = 'p3_passengers';

export const PmPassengers: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < ev(S, 'silence') ? <Shout f={f} t={t} /> : t < 6.6 ? <Still f={f} t={t} /> : t < ev(S, 'fear') ? <Woman f={f} t={t} /> : <Fear f={f} t={t} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

/** Camera among the seats looking forward: backs of the passengers' heads, Gleb by the cab facing us. */
const Shout: React.FC<{f: number; t: number}> = ({f, t}) => {
  const ls = lipSync(S, 'p3_g1', f);
  const g = glebStand(
    f,
    {bodyTurn: 0.05, headTurn: 0.0, eyeX: 0.1, armL: {shoulder: 34, elbow: 30, wrist: 0, hand: 'open'}, armR: {shoulder: 30, elbow: 34, wrist: 0, hand: 'open'}, lean: -2},
    'fear',
  );
  const backs = [
    {d: OLD_WOMAN, X: -0.6, z: 3.3},
    {d: BACK_PASSENGERS[0], X: 0.62, z: 2.4},
    {d: BACK_PASSENGERS[2], X: -0.62, z: 1.5},
  ].map((o, i) => ({...o, p: frozen(withExpr(seatedPose(3.7, {headTurn: 3.7, headNod: 0.15}), 'neutral')), id: `bk${i}`}));
  const k = ease.cam(clamp(t / 3.6));
  // aim at Gleb's face (standing at z 4.4): bp → screen, then centre it
  const fx = 540;
  const fy = 760 + ((0.55 - 0.373) * 1500) / 4.4 - 436 * (1.3 / 4.4) + 120;
  const Z = 2.0 + 0.25 * k;
  return (
    <AisleShot
      facing="front"
      cam={{x: (fx - 540) * Z, y: (fy - 960) * Z, zoom: Z, rot: 0, shake: 1.2, shakeFreq: 0.6}}
      occupants={[...backs, {d: GLEB_CIVIL, p: g, X: 0.0, z: 4.4, Y: 0.373, id: 'g3s', mouth: ls.talking ? ls.mouth : undefined}]}
    />
  );
};

const Still: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'silence');
  const a = facePoint(SEATING.back[0].X, SEATING.back[0].z, BACK_PASSENGERS[0]);
  const b = facePoint(SEATING.coat.X, SEATING.coat.z, BACK_PASSENGERS[0]);
  const u = ease.inOut(clamp(lt / 3));
  return <RearAisle f={f} light={flicker(t, [[5.2, 5.4]], 4)} cam={{...camOn(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(3.6, 5.0, u)), shake: 0.6, shakeFreq: 0.5}} />;
};

const Woman: React.FC<{f: number; t: number}> = ({f, t}) => {
  const awake = ease.inOut(clamp((t - ev(S, 'womanUp')) / 1.4));
  const ls = lipSync(S, 'p3_w1', f);
  const p = womanPose(f, awake);
  const Z = 2.7 + 0.35 * ease.cam(clamp((t - 6.6) / 4));
  return <RearAisle f={f} woman={p} womanMouth={ls.talking ? ls.mouth : undefined} cam={{...womanCam(Z), shake: 0.5, shakeFreq: 0.4}} />;
};

const Fear: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'fear');
  const e = exprTrack(Math.round(lt * 30), [
    [0, 'shock'],
    [30, 'fear', 30],
  ]);
  const p = glebStand(f, {bodyTurn: -0.1, headTurn: -0.15, eyeX: -0.35, headNod: 0.02, pupil: 0.7}, e);
  const push = ease.cam(clamp(lt / 4.4));
  return <GlebStandClose p={{...p, pupil: lerp(0.9, 0.62, ramp(lt, 0, 1))}} s={3.0} cam={{x: 0, y: -60 * push, zoom: 1 + 0.18 * push, rot: 0, shake: 0.6, shakeFreq: 0.4}} />;
};
