// Ep2 Scene 2 — the mirror (0:08–0:23): Gleb walks to the cab, looks at the
// empty seat, then up at the mirror: the driver is there. The reflection turns
// its head; Gleb spins round — the seat is empty; lights flicker.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AisleShot, DriverCabShot} from '../bus/shots';
import {GlebStandClose, glebStand} from './common2';
import {MirrorClose} from './P1Hook';
import {RearMirror} from './world/Props';
import {GLEB_CIVIL} from '../../characters/designs';
import {Act, L_BUS, Post, dim} from '../bus/common';
import {exprTrack, lipSync} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {flicker} from '../../effects/Weather';
import {driverPose} from '../bus/S3Stop';
import {ev, evArr} from '../../data';

const S = 'p2_mirror';

export const PmMirror: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const fl = flicker(t, evArr(S, 'flicker') as unknown as number[][], 11);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3.4 ? <Walk f={f} t={t} /> : t < 6.6 ? <Look f={f} t={t} /> : t < ev(S, 'whip') ? <Reflection f={f} t={t} /> : <Empty f={f} t={t} fl={fl} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

const Walk: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = clamp(t / ev(S, 'walkEnd'));
  const z = lerp(1.5, 5.2, ease.inOut(k));
  const cyc = walk(t * 0.7, k < 1 ? 0.6 : 0);
  const g = glebStand(f, {bodyTurn: 3.7, headTurn: 3.7, lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR}, 'anxiety');
  return (
    <AisleShot
      facing="front"
      cam={{x: 0, y: -40 * k, zoom: 1.05 + 0.12 * k, rot: fbm(f / 40, 2) * 0.4, shake: 1.2, shakeFreq: 0.6}}
      occupants={[{d: GLEB_CIVIL, p: g, X: 0.02, z, Y: 0.373, id: 'g2w'}]}
    />
  );
};

const Look: React.FC<{f: number; t: number}> = ({f, t}) => {
  const up = ease.inOut(clamp((t - ev(S, 'lookUp')) / 0.6));
  const ls = lipSync(S, 'p2_g1', f);
  const e = exprTrack(Math.round((t - 3.4) * 30), [
    [0, 'anxiety'],
    [36, 'confusion', 14],
    [60, 'fear', 20],
  ]);
  const p = glebStand(f, {bodyTurn: -0.25, headTurn: -0.3, eyeX: -0.4, eyeY: lerp(0.6, -0.6, up), headNod: lerp(0.2, -0.12, up)}, e);
  return <GlebStandClose p={p} mouth={ls.talking ? ls.mouth : undefined} cam={{x: 0, y: -20 * up, zoom: 1.02 + 0.03 * (t - 3.4), rot: 0, shake: 0.8, shakeFreq: 0.5}} />;
};

const Reflection: React.FC<{f: number; t: number}> = ({f, t}) => {
  const turn = ease.inOut(clamp((t - ev(S, 'reflTurn')) / 1.2));
  return <MirrorClose f={f} t0={6.6} t={t} headTurn={lerp(-0.6, 0.05, turn)} zoomFrom={1.15} />;
};

const Empty: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const lt = t - ev(S, 'whip');
  const whip = ease.out(clamp(lt / 0.3));
  const g = glebStand(f, {bodyTurn: lerp(0.4, -0.6, whip), headTurn: lerp(0.8, -0.75, whip), eyeX: -0.5}, 'fear');
  const k = ease.cam(clamp(lt / 4));
  return (
    <DriverCabShot
      f={f}
      light={fl}
      clock="00:14"
      wheelTurn={Math.sin(t * 1.3) * 18}
      cam={{x: 40 + (1 - whip) * -260, y: -80, zoom: 1.08 + 0.06 * k, rot: (1 - whip) * 4, shake: 1.5 + (1 - whip) * 6, shakeFreq: 0.8}}
      driver={null}
      extra={
        <>
          <RearMirror x={760} y={240} w={300} h={120} driver={null} light={fl} id="m2e" />
          <Act d={GLEB_CIVIL} p={g} x={960} y={1620} s={1.6} id="g2e" light={dim(L_BUS, 0.5 + 0.5 * fl)} legs={false} />
          <AbsoluteFill style={{background: '#000', opacity: (1 - fl) * 0.55}} />
        </>
      }
    />
  );
};
