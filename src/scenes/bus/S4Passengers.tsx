// Scene 4 — strange passengers (0:38–0:53): Gleb sits by the window, the
// woman opposite, the man in the coat on the back seat; no signal; the
// camera slowly travels across perfectly motionless faces.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AisleShot, Occupant, placeAt} from './shots';
import {PhoneInHand} from './world/Phone';
import {BACK_PASSENGERS, COAT_MAN, GLEB_CIVIL, OLD_WOMAN} from '../../characters/designs';
import {L_PHONE, Post, frozen, glebPose, seatedPose} from './common';
import {Glow, flicker} from '../../effects/Weather';
import {exprTrack, withExpr} from '../../animation/performance';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {Design, Pose} from '../../characters/types';

const S = 's4_passengers';
void S;

/** Who sits where (rear-facing camera). Shared with scenes 5–8. */
export const SEATING = {
  gleb: {X: 0.6, z: 2.4},
  woman: {X: -0.6, z: 2.5},
  coat: {X: 0.12, z: 7.25},
  back: [
    {X: -0.62, z: 5.1},
    {X: 0.62, z: 6.0},
    {X: -0.58, z: 6.9},
  ],
};

export const facePoint = (X: number, z: number, d: Design, Y = 0.27) => {
  const p = placeAt(X, z, Y);
  return {x: p.x, y: p.y - 436 * p.s * d.height};
};
/** Camera that centres world point (x, y) at zoom Z (see Layer transform). */
export const camOn = (x: number, y: number, Z: number) => ({x: (x - 540) * Z, y: (y - 960) * Z, zoom: Z, rot: 0, shake: 0});

const stillFace = (turn: number, over: Partial<Pose> = {}): Pose =>
  frozen(withExpr(seatedPose(turn, {headTurn: turn * 0.4, eyeX: 0, eyeY: 0.05, lidDrop: 0.25, ...over}), 'neutral'));

export const passengers = (f: number, opts: {coat?: boolean; woman?: boolean} = {}): Occupant[] => {
  const out: Occupant[] = [];
  if (opts.woman !== false) out.push({d: OLD_WOMAN, p: {...stillFace(0.25, {headNod: 0.1}), browWorry: 0.2}, ...SEATING.woman, id: 'pw'});
  if (opts.coat !== false) out.push({d: COAT_MAN, p: stillFace(-0.1, {headNod: 0.05}), ...SEATING.coat, id: 'pc'});
  BACK_PASSENGERS.forEach((d, i) => out.push({d, p: stillFace(i % 2 ? -0.3 : 0.3, {headNod: 0.15}), ...SEATING.back[i], id: `pb${i}`}));
  void f;
  return out;
};

export const LbPassengers: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const fl = flicker(t, [[8.4, 8.7]], 5);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3.8 ? <SitDown f={f} t={t} /> : t < 6.2 ? <NoSignal f={f} t={t} /> : t < 11 ? <Faces f={f} t={t} fl={fl} /> : <LookAround f={f} t={t} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

const glebSeat = (f: number, sit: number, over: Partial<Pose> = {}, expr: Parameters<typeof glebPose>[2] = 'neutral') => {
  const p = seatedPose(-0.3, {headTurn: -0.2, ...over});
  // blend from standing to seated
  const st = {hip: 0, knee: 4, foot: 0};
  const k = ease.inOut(clamp(sit));
  p.legL = {hip: lerp(st.hip, p.legL.hip, k), knee: lerp(st.knee, p.legL.knee, k), foot: 0};
  p.legR = {hip: lerp(st.hip, p.legR.hip, k), knee: lerp(st.knee, p.legR.knee, k), foot: 0};
  return glebPose(f, p, expr, 7);
};

const SitDown: React.FC<{f: number; t: number}> = ({f, t}) => {
  const sit = clamp((t - 0.6) / 1.0);
  const Y = lerp(0.373, 0.27, ease.inOut(sit));
  const X = lerp(0.3, SEATING.gleb.X, ease.inOut(clamp((t - 0.1) / 0.8)));
  const g = glebSeat(f, sit, {headTurn: lerp(0.4, -0.2, ramp(t, 1.6, 2.6)), eyeX: t > 2.4 ? -0.5 : 0}, t > 2.4 ? 'interest' : 'neutral');
  const k = ease.cam(clamp(t / 3.8));
  return (
    <AisleShot
      facing="rear"
      speed={1}
      cam={{x: 60 * k, y: 40 * k, zoom: 1.05 + 0.08 * k, rot: fbm(f / 40, 2) * 0.4, shake: 1.2, shakeFreq: 0.6}}
      occupants={[...passengers(f), {d: GLEB_CIVIL, p: g, X, z: SEATING.gleb.z, Y, id: 'g4'}]}
    />
  );
};

const NoSignal: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 3.8;
  const up = ease.out(clamp(lt / 0.4));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(16px) brightness(0.55)'}}>
        <AisleShot facing="rear" cam={{x: 120, y: 0, zoom: 1.4, rot: 0, shake: 0}} occupants={passengers(f)} />
      </AbsoluteFill>
      <PhoneInHand x={540 + fbm(f / 20, 2) * 4} y={1120 + (1 - up) * 500} rot={4} scale={1.2} mode="nosignal" time="23:58" />
      <Glow x={540} y={1050} r={700} color="#8fb0ff" intensity={0.15} />
    </AbsoluteFill>
  );
};

const Faces: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const lt = t - 6.2;
  const pw = facePoint(SEATING.woman.X, SEATING.woman.z, OLD_WOMAN);
  const b0 = facePoint(SEATING.back[0].X, SEATING.back[0].z, BACK_PASSENGERS[0]);
  const pc = facePoint(SEATING.coat.X, SEATING.coat.z, COAT_MAN);
  const b1 = facePoint(SEATING.back[1].X, SEATING.back[1].z, BACK_PASSENGERS[1]);
  const keys: [number, {x: number; y: number}, number][] = [
    [0, pw, 2.4],
    [1.6, pw, 2.6],
    [2.6, b0, 4.0],
    [3.5, pc, 5.4],
    [4.8, b1, 4.6],
  ];
  let i = 0;
  while (i < keys.length - 1 && lt > keys[i + 1][0]) i++;
  const [ta, pa, za] = keys[i];
  const [tb, pb, zb] = keys[Math.min(i + 1, keys.length - 1)];
  const u = tb > ta ? ease.inOut(clamp((lt - ta) / (tb - ta))) : 1;
  const cam = camOn(lerp(pa.x, pb.x, u), lerp(pa.y, pb.y, u), lerp(za, zb, u));
  return <AisleShot facing="rear" light={fl} cam={{...cam, shake: 0.6, shakeFreq: 0.5}} occupants={[...passengers(f), {d: GLEB_CIVIL, p: glebSeat(f, 1), ...SEATING.gleb, id: 'g4f'}]} />;
};

const LookAround: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 11;
  const lf = Math.round(lt * 30);
  const e = exprTrack(lf, [
    [0, 'interest'],
    [25, 'anxiety', 30],
  ]);
  const head = lerp(-0.7, 0.75, ease.inOut(clamp(lt / 3.2)));
  const g = glebSeat(f, 1, {headTurn: head, eyeX: head * 0.6, bodyTurn: -0.2}, e);
  const fp = facePoint(SEATING.gleb.X, SEATING.gleb.z, GLEB_CIVIL);
  const Z = 2.2 + 0.25 * ease.cam(clamp(lt / 4));
  return <AisleShot facing="rear" cam={{...camOn(fp.x, fp.y + 140, Z), shake: 0.8, shakeFreq: 0.5}} occupants={[...passengers(f), {d: GLEB_CIVIL, p: g, ...SEATING.gleb, id: 'g4l'}]} />;
};
