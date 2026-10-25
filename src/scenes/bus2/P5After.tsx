// Ep2 Scene 5 — in the cabin (0:53–1:08). Gleb jerks away from the rear
// window; the official banner plays 0:55–1:02.2 centred — composition keeps
// Gleb's face above it (y < 700) and the floor below; then he catches his
// breath and the woman turns to him.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GlebStandClose, RearAisle, glebStand, womanCam, womanPose} from './common2';
import {GLEB_CIVIL} from '../../characters/designs';
import {Post} from '../bus/common';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp} from '../../animation/core';

export const PmAfter: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 2 ? <Retreat f={f} t={t} /> : t < 9.2 ? <Wide f={f} t={t} /> : t < 12.2 ? <Breath f={f} t={t} /> : <WomanLooks f={f} t={t} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

const Retreat: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = ease.out(clamp(t / 1.8));
  const z = lerp(5.6, 2.3, k);
  const cyc = walk(-t * 1.3, (1 - k) * 0.9);
  const g = glebStand(f, {bodyTurn: 0.1, headTurn: lerp(3.5, 0.2, ease.out(clamp(t / 0.6))), lean: -4, legL: cyc.legL, legR: cyc.legR, armL: {shoulder: 20, elbow: 40, wrist: 0, hand: 'open'}, armR: {shoulder: 16, elbow: 36, wrist: 0, hand: 'open'}}, 'fear');
  return <RearAisle f={f} cam={{x: 0, y: 100 * k, zoom: 1.1, rot: fbm(f / 20, 3) * 1.2, shake: 3 * (1 - k) + 1, shakeFreq: 0.8}} extra={[{d: GLEB_CIVIL, p: g, X: 0.05, z, Y: 0.373, id: 'g5r'}]} />;
};

const Wide: React.FC<{f: number; t: number}> = ({f, t}) => {
  // Gleb grips the pole, breathing hard; framed high so his face is above the banner
  const g = glebStand(f, {bodyTurn: -0.2, headTurn: -0.35 + 0.15 * Math.sin(t * 0.6), eyeX: -0.3, armR: {shoulder: 120, elbow: 40, wrist: 0, hand: 'fist'}, armL: {shoulder: 8, elbow: 20, wrist: 0, hand: 'relaxed'}, shoulderUp: 0.25 + 0.1 * Math.sin(t * 5)}, 'anxiety');
  const gb = {...g, breathe: (Math.sin(t * 5) + 1) / 2};
  return <RearAisle f={f} cam={{x: 40, y: 270, zoom: 1.12, rot: fbm(f / 40, 3) * 0.3, shake: 1, shakeFreq: 0.6}} extra={[{d: GLEB_CIVIL, p: gb, X: 0.05, z: 2.3, Y: 0.373, id: 'g5w'}]} />;
};

const Breath: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 9.2;
  const g = glebStand(f, {bodyTurn: -0.25, headTurn: lerp(0.3, -0.7, ease.inOut(clamp((lt - 1.4) / 1.0))), eyeX: -0.6, headNod: 0.05, shoulderUp: 0.2 + 0.12 * Math.sin(t * 4.5)}, 'anxiety');
  return <GlebStandClose p={{...g, breathe: (Math.sin(t * 4.5) + 1) / 2}} s={2.7} cam={{x: 0, y: 0, zoom: 1 + 0.02 * lt, rot: 0, shake: 0.8, shakeFreq: 0.5}} />;
};

const WomanLooks: React.FC<{f: number; t: number}> = ({f, t}) => {
  const p = womanPose(f, 1, {headTurn: 0.45, eyeX: 0.4});
  return <RearAisle f={f} woman={p} cam={{...womanCam(2.4 + 0.1 * (t - 12.2)), shake: 0.5, shakeFreq: 0.4}} />;
};
