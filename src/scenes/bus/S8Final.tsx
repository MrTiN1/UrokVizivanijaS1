// Scene 8 — finale (1:43–1:50): Gleb looks up; the driver's seat is empty
// and the wheel turns by itself; frightened close-up; black; end titles.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {AisleShot, DriverCabShot} from './shots';
import {GLEB_CIVIL} from '../../characters/designs';
import {Act, L_PHONE, Post, dim, glebPose} from './common';
import {exprTrack, pose} from '../../animation/performance';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {BOKEH_BUS, Bokeh, flicker} from '../../effects/Weather';
import {EPISODE, ev} from '../../data';

const S = 's8_final';

export const LbFinal: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const fl = flicker(t, [[3.6, 4.5]], 21);
  const black = ev(S, 'black');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < ev(S, 'empty') ? <LookUp f={f} t={t} /> : t < ev(S, 'face') ? <Empty f={f} t={t} /> : t < black ? <Face f={f} t={t} fl={fl} /> : <EndCard t={t - black} />}
      {t < black ? <Post warm={0.02} cold /> : null}
    </AbsoluteFill>
  );
};

const LookUp: React.FC<{f: number; t: number}> = ({f, t}) => {
  const up = ease.inOut(clamp((t - 0.2) / 1.2));
  const e = exprTrack(Math.round(t * 30), [
    [0, 'anxiety'],
    [30, 'fear', 20],
  ]);
  let g = pose({bodyTurn: 0.1, headTurn: 0.05, headNod: lerp(0.45, -0.05, up), eyeY: lerp(0.8, -0.1, up)});
  g = glebPose(f, g, e, 7);
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + 0.04 * t, rot: 0, shake: 0.8, shakeFreq: 0.5}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_BUS} top="#1a2234" bottom="#07080c" />
      </Layer>
      <Layer depth={1}>
        <Act d={GLEB_CIVIL} p={g} x={540} y={2350} s={3.3} id="g8u" light={L_PHONE} legs={false} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 100%, rgba(140,175,255,0.25), transparent 70%)'}} />
      </Layer>
    </CameraRig>
  );
};

const Empty: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'empty');
  const push = ease.cam(clamp(lt / 1.6));
  return (
    <DriverCabShot
      f={f}
      clock="00:13"
      wheelTurn={Math.sin(lt * 1.6) * 14 + fbm(f / 20, 3) * 4}
      cam={{x: -40 * push, y: -120 * push, zoom: 1.05 + 0.2 * push, rot: 0, shake: 1.5, shakeFreq: 0.7}}
      driver={null}
    />
  );
};

const Face: React.FC<{f: number; t: number; fl: number}> = ({f, t, fl}) => {
  const lt = t - ev(S, 'face');
  let g = pose({bodyTurn: 0, headTurn: -0.08, eyeX: -0.2, headNod: -0.04});
  g = glebPose(f, g, 'shock', 7);
  g = {...g, pupil: 0.6, blink: 0};
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + 0.12 * lt, rot: 0, shake: 2, shakeFreq: 0.8}}>
      <Layer depth={1}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #1a2133, #040509 70%)'}} />
        <Act d={GLEB_CIVIL} p={g} x={540} y={960 + 436 * 4.4 - 40 * 4.4} s={4.4} id="g8f" light={dim(L_PHONE, 0.4 + 0.6 * fl)} legs={false} />
        <AbsoluteFill style={{background: '#000', opacity: (1 - fl) * 0.55}} />
      </Layer>
    </CameraRig>
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const a = ease.out(clamp((t - 0.15) / 0.5));
  const b = ease.out(clamp((t - 0.7) / 0.5));
  const c = clamp((t - 1.2) / 0.5);
  return (
    <AbsoluteFill style={{background: '#030406', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: 'Russo One', fontSize: 92, color: '#eef2f8', letterSpacing: 4, textAlign: 'center', lineHeight: 1.05, opacity: a, transform: `scale(${1.1 - 0.1 * a})`, textShadow: '0 6px 30px rgba(0,0,0,0.9)'}}>
        ПРОДОЛЖЕНИЕ
        <br />
        СЛЕДУЕТ
      </div>
      <div style={{marginTop: 44, width: 300 * b, height: 4, background: '#ff4b3a', boxShadow: '0 0 14px rgba(255,75,58,0.7)'}} />
      <div style={{marginTop: 38, fontFamily: 'Oswald', fontWeight: 700, fontSize: 56, color: '#ff4b3a', letterSpacing: 5, opacity: b, transform: `translateY(${(1 - b) * 18}px)`}}>{EPISODE.next}</div>
      <div style={{position: 'absolute', top: 260, fontFamily: 'Russo One', fontSize: 40, color: '#6f7480', letterSpacing: 6, opacity: c}}>{EPISODE.series}</div>
      <div style={{position: 'absolute', bottom: 300, fontFamily: 'Montserrat', fontWeight: 500, fontSize: 30, color: '#8d8a84', opacity: c}}>{EPISODE.disclaimer}</div>
      {void lerp}
      {void ramp}
    </AbsoluteFill>
  );
};
