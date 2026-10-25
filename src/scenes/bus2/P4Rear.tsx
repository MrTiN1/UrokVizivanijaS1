// Ep2 Scene 4 — the rear window (0:38–0:53): Gleb walks to the back; palm
// prints appear on the glass; behind the bus walks a man in a grey hoodie —
// he lifts his head: Gleb's face. Short silence. Gleb backs away.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {GlebStandClose, RearAisle, glebStand} from './common2';
import {Print, RearRoad, RearWindow} from './world/Props';
import {GLEB_CIVIL} from '../../characters/designs';
import {Post} from '../bus/common';
import {pose} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {alive} from '../../animation/performance';
import {flicker} from '../../effects/Weather';
import {ev, evArr} from '../../data';

const S = 'p4_rear';

export const PRINTS = (times: number[]): Print[] => [
  {x: 300, y: 720, s: 0.85, rot: -12, at: times[0]},
  {x: 760, y: 680, s: 0.9, rot: 10, at: times[1], flip: true},
  {x: 410, y: 1080, s: 0.8, rot: -4, at: times[2]},
  {x: 850, y: 1050, s: 0.85, rot: 16, at: times[3], flip: true},
];

export const PmRear: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const fl = flicker(t, evArr(S, 'flicker') as unknown as number[][], 17);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3.2 ? <WalkBack f={f} t={t} fl={fl} /> : t < ev(S, 'stepBack') ? <Window f={f} t={t} /> : <StepBack f={f} t={t} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

const WalkBack: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const k = clamp(t / 3.0);
  const z = lerp(1.3, 5.6, ease.inOut(k));
  const cyc = walk(t * 0.75, 0.65);
  const g = glebStand(f, {bodyTurn: 3.7, headTurn: 3.7, lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR}, 'anxiety');
  return (
    <RearAisle
      f={f}
      light={fl}
      cam={{x: 0, y: -30, zoom: 1.08 + 0.1 * k, rot: Math.sin(t * 1.4) * 0.8, shake: 1.6, shakeFreq: 0.6}}
      extra={[{d: GLEB_CIVIL, p: g, X: 0.02, z, Y: 0.373, id: 'g4w'}]}
    />
  );
};

/** The twin walking on the road behind the bus, keeping the same distance. */
const twin = (f: number, t: number) => {
  const up = ease.inOut(clamp((t - ev(S, 'twinUp')) / 1.0));
  const cyc = walk(t * 0.8, 0.75);
  let p = pose({bodyTurn: 0.0, headTurn: 0.0, headNod: lerp(0.5, -0.02, up), eyeY: lerp(0.7, 0, up), legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR, lean: cyc.lean});
  p = alive(p, f, {seed: 77, saccadeAmp: 0.02, headMotion: 0.3});
  p = {...p, blink: 0, lidDrop: 0.18, browWorry: 0.1};
  return {p, bob: cyc.bob};
};

const Window: React.FC<{f: number; t: number}> = ({f, t}) => {
  const prints = PRINTS(evArr(S, 'prints'));
  const show = t >= 6.2;
  const tw = twin(f, t);
  // the figure: small far away, then the camera pushes in to his face
  const push = ease.cam(clamp((t - 10.4) / 1.8));
  const s = lerp(0.36, 0.38, clamp((t - 6.2) / 4));
  const x = 540 + fbm(f / 60, 3) * 6;
  const y = 1240 - 430 * s + tw.bob * s;
  const faceY = y - 436 * s;
  const Zwin = t < 6.2 ? 1.0 + 0.04 * (t - 3.2) : lerp(1.15, 1.35, clamp((t - 6.2) / 4.2));
  const Z = lerp(Zwin, 3.4, push);
  const cx = lerp(0, (x - 540) * Z, push);
  const cy = lerp(t < 6.2 ? 0 : -40, (faceY + 40 - 960) * Z, push);
  return (
    <CameraRig cam={{x: cx, y: cy, zoom: Z, rot: Math.sin(t * 1.2) * 0.4 * (1 - push), shake: 1.0, shakeFreq: 0.6}}>
      <Layer depth={1}>
        <RearWindow t={t} prints={prints}>
          <RearRoad id="r4" figure={show ? {d: GLEB_CIVIL, p: tw.p, x, y, s} : null} />
        </RearWindow>
      </Layer>
    </CameraRig>
  );
};

const StepBack: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'stepBack');
  const back = ease.out(clamp(lt / 1.4));
  const cyc = walk(-lt * 1.1, (1 - back) * 0.9);
  const p = glebStand(f, {bodyTurn: 0.05, headTurn: 0.05, headNod: -0.05, lean: -5, legL: cyc.legL, legR: cyc.legR, armL: {shoulder: 26, elbow: 50, wrist: 0, hand: 'open'}, armR: {shoulder: 20, elbow: 46, wrist: 0, hand: 'open'}}, 'shock');
  return <GlebStandClose p={{...p, pupil: 0.62}} s={lerp(3.0, 2.3, back)} cam={{x: 0, y: 0, zoom: 1, rot: 0, shake: 2.2 * (1 - back) + 0.6, shakeFreq: 0.7}} />;
};

void ramp;
