// Scene 5 — the repeating stop (0:53–1:08). The «УЛИЦА ЛЕСНАЯ» stop passes,
// then (after the mid-roll banner window 0:55–1:02.2) the very same stop,
// lamp and billboard pass again, and a third time.
// Composition note: during the banner (scene-local 2.0–9.2 s) the key
// elements stay above y≈700 or below y≈1210 — the banner owns the centre.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {WindowView} from './world/Places';
import {AisleShot} from './shots';
import {GLEB_CIVIL} from '../../characters/designs';
import {Act, L_BUS, Post, dim, glebPose, seatedPose} from './common';
import {SEATING, passengers} from './S4Passengers';
import {exprTrack, lipSync} from '../../animation/performance';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {Mist} from '../../effects/Weather';
import {EPISODE, scene} from '../../data';

const S = 's5_loop';
const PASSES = [1.0, 10.9, 14.0];
const SPEED = 620;

export const LbLoop: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const sc = scene(S);
  const b = EPISODE.banner;
  const bannerA = b ? b.at - sc.start : 99;
  const bannerB = b ? bannerA + b.duration : 99;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 2 ? <OverShoulder f={f} t={t} /> : t < 9.2 ? <Wide f={f} t={t} bannerA={bannerA} bannerB={bannerB} /> : t < 12.8 ? <AtGlass f={f} t={t} /> : <Third f={f} t={t} />}
      <Post warm={0.04} cold />
    </AbsoluteFill>
  );
};

const OverShoulder: React.FC<{f: number; t: number}> = ({f, t}) => {
  const g = glebPose(f, seatedPose(-2.9, {headTurn: -2.6, armL: {shoulder: 2, elbow: 16, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 2, elbow: 16, wrist: 0, hand: 'relaxed'}}), 'neutral', 7);
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1.02 + t * 0.01, rot: 0, shake: 1, shakeFreq: 0.6}}>
      <Layer depth={0.6}>
        <WindowView t={t} speed={SPEED} passes={PASSES} w={1080} h={1920} />
        <AbsoluteFill style={{boxShadow: 'inset 0 0 0 40px #1a1f27, inset 0 0 120px 60px rgba(0,0,0,0.6)'}} />
      </Layer>
      <Layer depth={1.2}>
        <Act d={GLEB_CIVIL} p={g} x={900} y={2050} s={2.3} id="s5os" light={dim(L_BUS, 0.5)} legs={false} />
      </Layer>
    </CameraRig>
  );
};

const Wide: React.FC<{f: number; t: number; bannerA: number; bannerB: number}> = ({f, t}) => {
  // Gleb half-turned to the window, the others frozen. Camera framed high so
  // Gleb's face sits above the centred banner.
  const g = glebPose(f, seatedPose(-0.3, {headTurn: lerp(-0.2, 0.7, ramp(t, 2.5, 4)), eyeX: 0.6}), 'doubt', 7);
  const k = ease.cam(clamp((t - 2) / 7.2));
  return (
    <AisleShot
      facing="rear"
      speed={1.2}
      cam={{x: 140 + 20 * k, y: 260, zoom: 1.12 + 0.04 * k, rot: fbm(f / 40, 3) * 0.3, shake: 1, shakeFreq: 0.6}}
      occupants={[...passengers(f), {d: GLEB_CIVIL, p: g, ...SEATING.gleb, id: 'g5w'}]}
    />
  );
};

const AtGlass: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 9.2;
  const lf = Math.round(lt * 30);
  const ls = lipSync(S, 's5_g1', f);
  const e = exprTrack(lf, [
    [0, 'interest'],
    [24, 'confusion', 18],
    [70, 'anxiety', 24],
  ]);
  let g = seatedPose(0.85, {headTurn: 0.95, eyeX: 0.7, headNod: 0.02, armL: {shoulder: 2, elbow: 16, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 2, elbow: 16, wrist: 0, hand: 'relaxed'}});
  g = glebPose(f, g, e, 7);
  const push = ease.cam(clamp(lt / 3.6));
  return (
    <CameraRig cam={{x: 40 * push, y: -40 * push, zoom: 1.0 + 0.08 * push, rot: 0, shake: 1, shakeFreq: 0.6}}>
      <Layer depth={0.6}>
        <div style={{position: 'absolute', left: 300, top: 0, width: 900, height: 1920, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -300, top: 0, width: 1080, height: 1920}}>
            <WindowView t={t} speed={SPEED} passes={PASSES} w={1080} h={1920} />
          </div>
          <AbsoluteFill style={{boxShadow: 'inset 30px 0 0 0 #1a1f27, inset 0 0 120px 40px rgba(0,0,0,0.55)'}} />
        </div>
        <div style={{position: 'absolute', left: 0, top: 0, width: 320, height: 1920, background: 'linear-gradient(90deg,#2a323c,#38424e)'}} />
      </Layer>
      <Layer depth={1}>
        <Act d={GLEB_CIVIL} p={g} x={300} y={2120} s={2.5} id="s5g" light={{...L_BUS, x: 0.8, rim: '#ffd9a0', rimStrength: 0.6}} mouth={ls.talking ? ls.mouth : undefined} legs={false} />
        <Mist y={1700} height={400} opacity={0.05} />
      </Layer>
    </CameraRig>
  );
};

const Third: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 12.8;
  const z = 1.0 + 0.35 * ease.cam(clamp(lt / 2.2));
  const g = glebPose(f, seatedPose(0.85, {headTurn: 0.95, eyeX: 0.8}), 'fear', 7, 0.7);
  return (
    <CameraRig cam={{x: -80 * (z - 1), y: 220 * (z - 1), zoom: z, rot: fbm(f / 12, 5) * 0.6, shake: 2.5, shakeFreq: 0.8}}>
      <Layer depth={1}>
        <WindowView t={t} speed={SPEED} passes={PASSES} w={1080} h={1920} />
        {/* his reflection over the stop */}
        <AbsoluteFill style={{opacity: 0.14, mixBlendMode: 'screen', transform: 'scaleX(-1)', filter: 'blur(1px)'}}>
          <Act d={GLEB_CIVIL} p={g} x={420} y={2000} s={2.2} id="s5r" light={L_BUS} legs={false} />
        </AbsoluteFill>
        <AbsoluteFill style={{boxShadow: 'inset 0 0 160px 80px rgba(0,0,0,0.65)'}} />
      </Layer>
    </CameraRig>
  );
};
