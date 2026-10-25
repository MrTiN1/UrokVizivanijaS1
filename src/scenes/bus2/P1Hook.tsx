// Ep2 Scene 1 — hook (0:00–0:08): the empty driver's seat, the wheel turning
// by itself, Gleb in the aisle; whip to the rear-view mirror: in the
// reflection the driver is in his seat. Title.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {DriverCabShot} from '../bus/shots';
import {RearAisle} from './common2';
import {RearMirror} from './world/Props';
import {GLEB_CIVIL} from '../../characters/designs';
import {Post} from '../bus/common';
import {driverPose} from '../bus/S3Stop';
import {glebStand} from './common2';
import {BOKEH_BUS, Bokeh, flicker} from '../../effects/Weather';
import {Flash} from '../../effects/Atmosphere';
import {SeriesTitle} from '../../components/Title';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {EPISODE, ev} from '../../data';

const S = 'p1_hook';

export const PmHook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cut = ev(S, 'cut');
  const mir = ev(S, 'mirror');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3 ? <Wheel f={f} t={t} /> : t < mir ? <Aisle f={f} t={t} /> : t < cut ? <Mirror f={f} t={t} /> : <TitleBg t={t} />}
      <Post warm={0.04} cold />
      {t >= cut ? <SeriesTitle t={t - ev(S, 'titleHit')} series={EPISODE.series} sub={`СЕРИЯ ${EPISODE.number} — ${EPISODE.title}`} top={560} out={ramp(t, 7.6, 7.95)} /> : null}
      <Flash amount={Math.max(0, 1 - Math.abs(t - cut) / 0.12) * 0.6 + Math.max(0, 1 - Math.abs(t - mir) / 0.08) * 0.25} color="#dfe9ff" />
    </AbsoluteFill>
  );
};

const Wheel: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = ease.cam(clamp(t / 3));
  const Z = lerp(1.1, 1.55, k);
  const cy = lerp(1000, 1180, k);
  return (
    <DriverCabShot
      f={f}
      clock="00:13"
      wheelTurn={Math.sin(t * 1.3) * 22 + fbm(f / 18, 2) * 5}
      cam={{x: (470 - 540) * Z, y: (cy - 960) * Z, zoom: Z, rot: fbm(f / 30, 1) * 0.6, shake: 1.6, shakeFreq: 0.6}}
      driver={null}
    />
  );
};

const Aisle: React.FC<{f: number; t: number}> = ({f, t}) => {
  const g = glebStand(f, {bodyTurn: 0.1, headTurn: lerp(0.1, -0.3, ramp(t, 3.4, 4.2)), eyeX: -0.3, headNod: -0.05, armL: {shoulder: 10, elbow: 30, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 6, elbow: 20, wrist: 0, hand: 'relaxed'}}, 'fear', 0.7);
  return <RearAisle f={f} light={flicker(t, [[3.8, 4.1]], 3)} cam={{x: 40, y: -40, zoom: 1.12 + (t - 3) * 0.03, rot: 0, shake: 1.2, shakeFreq: 0.6}} extra={[{d: GLEB_CIVIL, p: g, X: 0.02, z: 2.0, Y: 0.373, id: 'g1a'}]} />;
};

/** Close-up of the mirror; whip-pan in (fast settle). */
export const MirrorClose: React.FC<{f: number; t0: number; t: number; headTurn: number; light?: number; mouthDriver?: boolean; zoomFrom?: number}> = ({f, t0, t, headTurn, light = 1, zoomFrom = 1.4}) => {
  const k = ease.out(clamp((t - t0) / 0.35));
  const p = {...driverPose(f, headTurn, {eyeX: headTurn * 0.4}), lidDrop: 0.3};
  return (
    <CameraRig cam={{x: (1 - k) * 380, y: (1 - k) * -220, zoom: lerp(zoomFrom, 1.0, k) + (t - t0) * 0.02, rot: (1 - k) * -6, shake: 1 + (1 - k) * 8, shakeFreq: 0.8}}>
      <Layer depth={0.5}>
        <Bokeh discs={[[200, 900, 200, '#ffc46b', 0.35], [880, 1100, 180, '#9fc4ff', 0.3], [540, 1500, 260, '#2c3145', 0.8], [700, 400, 120, '#ffc46b', 0.25]]} top="#070b16" bottom="#161d33" />
      </Layer>
      <Layer depth={1}>
        <RearMirror x={540} y={880} w={960} h={420} driver={{pose: p}} light={light} id="m1" />
      </Layer>
    </CameraRig>
  );
};

const Mirror: React.FC<{f: number; t: number}> = ({f, t}) => <MirrorClose f={f} t0={ev(S, 'mirror')} t={t} headTurn={-0.5} />;

const TitleBg: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{transform: `scale(${1.1 + (t - 6.4) * 0.06})`}}>
    <Bokeh discs={BOKEH_BUS} top="#101626" bottom="#030408" drift={-0.6} />
    <AbsoluteFill style={{background: 'rgba(5,8,16,0.5)'}} />
  </AbsoluteFill>
);
