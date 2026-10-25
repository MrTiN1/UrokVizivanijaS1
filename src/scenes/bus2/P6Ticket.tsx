// Ep2 Scene 6 — the ticket (1:08–1:25): the woman holds out an old paper
// ticket: «МАРШРУТ №13 / ПАССАЖИР: ГЛЕБ / ДАТА: ЗАВТРА». «Почему здесь
// завтрашняя дата?» — «Потому что ты ещё не доехал.» — «До чего?» Silence.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {GlebStandClose, RearAisle, glebStand, womanCam, womanPose} from './common2';
import {Ticket} from './world/Props';
import {GLEB_CIVIL, OLD_WOMAN} from '../../characters/designs';
import {Act, L_BUS, Post} from '../bus/common';
import {handWorld} from '../../characters/Character';
import {Hand} from '../../characters/Body';
import {exprTrack, lipSync} from '../../animation/performance';
import {clamp, ease, fbm, lerp} from '../../animation/core';
import {BOKEH_BUS, Bokeh} from '../../effects/Weather';
import {ev} from '../../data';

const S = 'p6_ticket';

export const PmTicket: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3 ? (
        <Offer f={f} t={t} />
      ) : t < 6.4 ? (
        <TicketClose f={f} t={t} push={0} />
      ) : t < 9.4 ? (
        <GlebAsks f={f} t={t} line="p6_g1" />
      ) : t < 12.6 ? (
        <WomanSays f={f} t={t} />
      ) : t < 14 ? (
        <GlebAsks f={f} t={t} line="p6_g2" />
      ) : t < 15 ? (
        <WomanSilent f={f} t={t} />
      ) : (
        <TicketClose f={f} t={t} push={ease.cam(clamp((t - 15) / 2))} />
      )}
      <Post warm={0.04} cold />
    </AbsoluteFill>
  );
};

/** Two-shot: the woman (seated, left) reaches out; Gleb's hand comes in from the right and takes the ticket. */
const Offer: React.FC<{f: number; t: number}> = ({f, t}) => {
  const reach = ease.inOut(clamp((t - ev(S, 'hand')) / 1.2));
  const take = ease.inOut(clamp((t - ev(S, 'take')) / 0.4));
  const wx = 400;
  const wy = 1430;
  const ws = 1.55;
  const base = womanPose(f, 1, {bodyTurn: 0.6, headTurn: 0.6, eyeX: 0.3});
  const p = {...base, armL: {shoulder: lerp(8, 78, reach), elbow: lerp(70, 18, reach), wrist: 0, hand: 'hold' as const}};
  const hw = handWorld(OLD_WOMAN, p, wx, wy, ws, 1);
  const tx = lerp(hw.x + 40, 980, take);
  const ty = lerp(hw.y + 20, 1060, take);
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + 0.03 * t, rot: 0, shake: 0.6, shakeFreq: 0.4}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_BUS} top="#1a2234" bottom="#07080c" />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <rect x={60} y={1080} width={680} height={900} rx={30} fill="#3b2e4a" />
          <rect x={60} y={1080} width={680} height={40} rx={20} fill="#4e3e60" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <Act d={OLD_WOMAN} p={p} x={wx} y={wy} s={ws} id="w6o" light={L_BUS} />
        {reach > 0.05 ? <Ticket x={tx} y={ty} scale={0.42} rot={lerp(-8, 6, take)} /> : null}
        {/* Gleb's hand entering from the right */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${lerp(1260, 1010, ease.out(clamp((t - 1.8) / 0.8)))} ${1110}) rotate(${-100}) scale(4.2)`}>
            <Hand pose={take > 0.5 ? 'hold' : 'open'} skin={GLEB_CIVIL.skin} shade={GLEB_CIVIL.skinShade} dir={-1} />
          </g>
          <path d={`M${lerp(1500, 1250, ease.out(clamp((t - 1.8) / 0.8)))} 1060 L1200 1060 L1200 1180 L${lerp(1500, 1250, ease.out(clamp((t - 1.8) / 0.8)))} 1180Z`} fill="#22252b" />
        </svg>
      </Layer>
    </CameraRig>
  );
};

/** The ticket held in Gleb's hands, filling the frame. */
const TicketClose: React.FC<{f: number; t: number; push: number}> = ({f, t, push}) => {
  const tremble = fbm(f / 3, 4) * 2.5;
  const sc = 1.55 + 0.05 * Math.min(1, (t - 3) / 3) + 0.55 * push;
  return (
    <CameraRig cam={{x: 0, y: -40 * push, zoom: 1, rot: 0, shake: 0.4, shakeFreq: 0.4}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_BUS} top="#141a2a" bottom="#06070b" />
        <AbsoluteFill style={{background: 'rgba(0,0,0,0.3)'}} />
      </Layer>
      <Layer depth={1}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {/* thumbs pinching the ticket edges */}
          <g transform={`translate(${540 - 300 * sc / 1.55} ${1000 + tremble}) rotate(-70) scale(${3.4 * sc / 1.55})`}>
            <Hand pose="hold" skin={GLEB_CIVIL.skin} shade={GLEB_CIVIL.skinShade} dir={1} />
          </g>
          <g transform={`translate(${540 + 300 * sc / 1.55} ${1000 - tremble}) rotate(70) scale(${3.4 * sc / 1.55})`}>
            <Hand pose="hold" skin={GLEB_CIVIL.skin} shade={GLEB_CIVIL.skinShade} dir={-1} />
          </g>
        </svg>
        <Ticket x={540 + tremble * 0.5} y={940 + tremble} scale={sc} rot={-2 + fbm(f / 40, 2)} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 50%, rgba(255,230,180,0.08), transparent 70%)'}} />
      </Layer>
    </CameraRig>
  );
};

const GlebAsks: React.FC<{f: number; t: number; line: string}> = ({f, t, line}) => {
  const ls = lipSync(S, line, f);
  const first = line === 'p6_g1';
  const lt = t - (first ? 6.4 : 12.6);
  const e = exprTrack(Math.round(lt * 30), first ? [[0, 'confusion'], [40, 'doubt', 20]] : [[0, 'anxiety'], [20, 'fear', 14]]);
  const p = glebStand(f, {bodyTurn: 0.35, headTurn: first ? lerp(0.1, 0.45, ease.inOut(clamp((lt - 0.4) / 0.6))) : 0.45, headNod: first ? lerp(0.35, 0.05, ease.inOut(clamp((lt - 0.2) / 0.6))) : 0.05, eyeX: 0.4, eyeY: first ? lerp(0.6, 0, clamp(lt / 0.8)) : 0}, e);
  return <GlebStandClose p={p} mouth={ls.talking ? ls.mouth : undefined} x={520} s={2.7} cam={{x: 0, y: 0, zoom: 1 + 0.02 * lt, rot: 0, shake: 0.7, shakeFreq: 0.5}} />;
};

const WomanSays: React.FC<{f: number; t: number}> = ({f, t}) => {
  const ls = lipSync(S, 'p6_w1', f);
  const p = womanPose(f, 1, {headTurn: 0.4, eyeX: 0.35});
  return <RearAisle f={f} woman={p} womanMouth={ls.talking ? ls.mouth : undefined} cam={{...womanCam(2.9 + 0.08 * (t - 9.4)), shake: 0.5, shakeFreq: 0.4}} />;
};

const WomanSilent: React.FC<{f: number; t: number}> = ({f, t}) => {
  const p = {...womanPose(f, 1, {headTurn: 0.4, eyeX: 0.35, headNod: 0.08}), smile: -0.2};
  return <RearAisle f={f} woman={p} cam={{...womanCam(3.1 + 0.1 * (t - 14)), shake: 0.4, shakeFreq: 0.4}} />;
};
