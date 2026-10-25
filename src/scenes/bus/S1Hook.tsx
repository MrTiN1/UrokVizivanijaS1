// Scene 1 — hook (0:00–0:08): empty night bus, flickering tube; Gleb by the
// window; close-up; hard cut to the series title.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AisleShot, GlebWindowShot} from './shots';
import {Glow, flicker} from '../../effects/Weather';
import {Flash} from '../../effects/Atmosphere';
import {SeriesTitle} from '../../components/Title';
import {GLEB_CIVIL} from '../../characters/designs';
import {L_BUS, Post, dim, glebPose, seatedPose} from './common';
import {exprTrack} from '../../animation/performance';
import {clamp, ease, fbm, ramp} from '../../animation/core';
import {EPISODE, evArr, ev} from '../../data';

const S = 's1_hook';

export const LbHook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cut = ev(S, 'cut');
  const fl = flicker(t, evArr(S, 'flicker') as unknown as number[][], 3);
  const titleT = t - ev(S, 'titleHit');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3.2 ? <EmptyBus f={f} t={t} light={fl} /> : t < cut ? <GlebClose f={f} t={t} light={fl} /> : <TitleBg f={f} t={t} />}
      <Post warm={0.04} cold />
      {t >= cut ? (
        <SeriesTitle t={titleT} series={EPISODE.series} sub={`СЕРИЯ ${EPISODE.number} — ${EPISODE.title}`} top={560} out={ramp(t, 7.6, 7.95)} />
      ) : null}
      <Flash amount={Math.max(0, 1 - Math.abs(t - cut) / 0.12) * 0.7} color="#dfe9ff" />
    </AbsoluteFill>
  );
};

const EmptyBus: React.FC<{f: number; t: number; light: number}> = ({f, t, light}) => {
  const k = ease.cam(clamp(t / 3.2));
  const sway = fbm(f / 40, 2);
  return (
    <AisleShot
      facing="front"
      light={light}
      speed={1}
      cam={{x: sway * 6, y: -20 * k, zoom: 1.0 + 0.1 * k, rot: sway * 0.5, shake: 1.5, shakeFreq: 0.6}}
      extra={<Glow x={540} y={260} r={420} color="#dcebff" intensity={0.25 * light} />}
    />
  );
};

const GlebClose: React.FC<{f: number; t: number; light: number}> = ({f, t, light}) => {
  const lt = t - 3.2;
  const lf = Math.round(lt * 30);
  const push = ease.cam(clamp(lt / 3.4));
  const e = exprTrack(lf, [
    [0, 'tired'],
    [40, 'anxiety', 30],
  ]);
  const base = seatedPose(0.55, {headTurn: 0.75 - 0.5 * ramp(lt, 1.4, 2.4), eyeX: 0.5 - 0.7 * ramp(lt, 1.3, 1.8), eyeY: 0.05, headNod: 0.05});
  const g = glebPose(f, base, e, 7);
  return (
    <GlebWindowShot
      t={t}
      speed={700}
      light={light}
      cam={{x: 40 * push, y: -260 * push, zoom: 1.05 + 0.85 * push, rot: 0, shake: 1.2, shakeFreq: 0.5}}
      gleb={{d: GLEB_CIVIL, p: g, x: 560, y: 1560, s: 1.55, id: 's1g', light: dim(L_BUS, 0.5 + 0.5 * light)}}
    />
  );
};

const TitleBg: React.FC<{f: number; t: number}> = ({f, t}) => (
  <AbsoluteFill style={{filter: 'blur(14px) brightness(0.45)'}}>
    <AisleShot facing="front" light={0.8} speed={1.4} cam={{x: 0, y: 0, zoom: 1.25 + (t - 6.6) * 0.05, rot: 0, shake: 0}} />
    <AbsoluteFill style={{background: 'rgba(5,8,16,0.4)'}} />
    {void f}
  </AbsoluteFill>
);
