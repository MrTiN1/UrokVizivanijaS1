// Ep2 Scene 8 — finale (1:43–1:50): the bus brakes hard; for the first time
// the doors open — onto the very stop where Gleb got on. Another Gleb stands
// there: «Не выходи. Я уже пробовал.» Black. To be continued.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {AisleShot} from '../bus/shots';
import {DoorView} from './world/Props';
import {GlebStandClose, glebStand} from './common2';
import {GLEB_CIVIL} from '../../characters/designs';
import {Post} from '../bus/common';
import {EndCard} from '../bus/S8Final';
import {alive, lipSync, pose} from '../../animation/performance';
import {clamp, ease, fbm, lerp} from '../../animation/core';
import {ev} from '../../data';

const S = 'p8_final';

export const PmFinal: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const black = ev(S, 'black');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < ev(S, 'doors') ? <Brake f={f} t={t} /> : t < 3.2 ? <Doors f={f} t={t} /> : t < 3.6 ? <React_ f={f} t={t} /> : t < black ? <Doors f={f} t={t} close /> : <EndCard t={t - black} />}
      {t < black ? <Post warm={0.04} /> : null}
    </AbsoluteFill>
  );
};

const Brake: React.FC<{f: number; t: number}> = ({f, t}) => {
  const jolt = Math.exp(-t * 4) * Math.sin(t * 22);
  const g = glebStand(f, {bodyTurn: 3.7, headTurn: 3.7, lean: 10 * Math.exp(-t * 3)}, 'fear');
  return (
    <AisleShot
      facing="front"
      speed={Math.max(0, 1 - t)}
      cam={{x: jolt * 20, y: jolt * 40, zoom: 1.1 + 0.05 * (1 - Math.exp(-t * 4)), rot: jolt * 2, shake: 6 * Math.exp(-t * 2), shakeFreq: 1}}
      occupants={[{d: GLEB_CIVIL, p: g, X: 0.02, z: 2.6, Y: 0.373, id: 'g8b'}]}
    />
  );
};

const twinPose = (f: number) => {
  let p = pose({bodyTurn: 0.0, headTurn: 0.0, headNod: 0.0, eyeX: 0, eyeY: 0, armL: {shoulder: 4, elbow: 8, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 4, elbow: 8, wrist: 0, hand: 'relaxed'}});
  p = alive(p, f, {seed: 88, saccadeAmp: 0.01, headMotion: 0.2});
  return {...p, lidDrop: 0.2, browWorry: 0.15, smile: -0.1};
};

const Doors: React.FC<{f: number; t: number; close?: boolean}> = ({f, t, close}) => {
  const door = ease.out(clamp((t - ev(S, 'doors')) / 0.9));
  const ls = lipSync(S, 'p8_t1', f);
  const showTwin = t > ev(S, 'twin') - 0.6;
  const push = close ? ease.cam(clamp((t - 3.6) / 1.2)) : 0;
  const s = 0.62;
  const x = 540;
  const y = 1330 - 430 * s + 70;
  const faceY = y - 436 * s;
  const Z = lerp(1.0 + 0.05 * Math.max(0, t - 1), 2.1, push);
  return (
    <CameraRig cam={{x: 0, y: (faceY + 60 - 960) * (Z - 1) * (push > 0 ? 1 : 0), zoom: Z, rot: fbm(f / 50, 3) * 0.3, shake: 0.6, shakeFreq: 0.5}}>
      <Layer depth={1}>
        <DoorView door={door} figure={showTwin ? {p: twinPose(f), x, y, s, mouth: ls.talking ? ls.mouth : undefined} : null} />
      </Layer>
    </CameraRig>
  );
};

/** A beat on Gleb in the pause between the two sentences. */
const React_: React.FC<{f: number; t: number}> = ({f}) => {
  const p = glebStand(f, {bodyTurn: 0.05, headTurn: 0.0, eyeX: 0, headNod: -0.03}, 'shock');
  return <GlebStandClose p={{...p, pupil: 0.6}} s={3.1} cam={{x: 0, y: 0, zoom: 1.05, rot: 0, shake: 1.5, shakeFreq: 0.7}} />;
};
