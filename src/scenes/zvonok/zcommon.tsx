// Shared helpers for «Звонок от себя».
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraRig, Cam, Layer} from '../../camera/Camera';
import {Act} from '../bus/common';
import {Bokeh} from '../../effects/Weather';
import {ARTEM} from '../../characters/designs';
import {Design, Light, Pose} from '../../characters/types';
import {MouthParams} from '../../characters/Head';
import {alive, pose, withExpr} from '../../animation/performance';
import {ExpressionName} from '../../characters/types';
import {L_LAMP} from './world/Home';

export const BOKEH_ROOM: [number, number, number, string, number][] = [
  [180, 520, 220, '#ffb867', 0.45], [860, 420, 200, '#7fa8ff', 0.4], [700, 980, 160, '#ffd29a', 0.3],
  [300, 1250, 240, '#3a2c22', 0.7], [920, 1300, 220, '#2b3a52', 0.6], [520, 300, 120, '#c66b4a', 0.25],
];
export const BOKEH_HALL: [number, number, number, string, number][] = [
  [540, 260, 260, '#ffcf8a', 0.5], [200, 900, 220, '#3a3340', 0.7], [880, 900, 220, '#2e2a34', 0.7], [540, 1400, 260, '#3a2e26', 0.6], [540, 760, 120, '#ffd29a', 0.25],
];

/** Artyom pose with life + expression. */
export const artem = (f: number, over: Partial<Pose>, expr: ExpressionName | Parameters<typeof withExpr>[1], amt = 1, seed = 31) => alive(withExpr(pose(over), expr, amt), f, {seed});

/** Close-up from the chest up on a soft out-of-focus background. */
export const Close: React.FC<{cam?: Cam; p: Pose; d?: Design; mouth?: MouthParams; light?: Light; x?: number; s?: number; discs?: [number, number, number, string, number][]; top?: string; bottom?: string; extra?: React.ReactNode}> = ({
  cam = {x: 0, y: 0, zoom: 1, rot: 0, shake: 0.7, shakeFreq: 0.5},
  p,
  d = ARTEM,
  mouth,
  light = L_LAMP,
  x = 540,
  s = 2.7,
  discs = BOKEH_ROOM,
  top = '#141826',
  bottom = '#08090d',
  extra,
}) => (
  <CameraRig cam={cam}>
    <Layer depth={0.5}>
      <Bokeh discs={discs} top={top} bottom={bottom} />
    </Layer>
    <Layer depth={1}>
      <Act d={d} p={p} x={x} y={960 + 436 * s - 30 * s} s={s} id={`cl-${d.id}`} light={light} mouth={mouth} legs={false} />
      {extra}
    </Layer>
  </CameraRig>
);

/** Phone glow on the face from below. */
export const PhoneGlow: React.FC<{amount?: number}> = ({amount = 1}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 30% at 50% 95%, rgba(150,185,255,${0.22 * amount}), transparent 70%)`, pointerEvents: 'none'}} />
);

/** Channel title card: «ПОСЛЕДНИЙ КАДР» + film title. t = seconds since start. */
export const ChannelTitle: React.FC<{t: number; out: number; title: string}> = ({t, out, title}) => {
  const a = Math.min(1, Math.max(0, t / 0.35));
  const b = Math.min(1, Math.max(0, (t - 0.35) / 0.4));
  return (
    <AbsoluteFill style={{opacity: 1 - out, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: a, transform: `translateY(${(1 - a) * 20}px)`}}>
        <div style={{width: 26, height: 26, borderRadius: 13, background: '#ff3b30', boxShadow: '0 0 18px rgba(255,59,48,0.8)'}} />
        <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: 54, letterSpacing: 10, color: '#e9ecf2', textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>ПОСЛЕДНИЙ КАДР</div>
      </div>
      <div style={{marginTop: 26, width: 420 * b, height: 3, background: '#ff3b30'}} />
      <div style={{marginTop: 30, fontFamily: 'Russo One', fontSize: 104, lineHeight: 1.0, textAlign: 'center', color: '#f3efe6', letterSpacing: 3, opacity: b, transform: `scale(${1.15 - 0.15 * b})`, textShadow: '0 8px 0 rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.7)', WebkitTextStroke: '3px rgba(0,0,0,0.6)', paintOrder: 'stroke fill'}}>
        {title.split(' ').map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Arms down; the phone at the ear is drawn separately by PhoneAtEar. */
export const EAR_ARM = {shoulder: 6, elbow: 18, wrist: 0, hand: 'relaxed' as const};

/**
 * Hand + phone pressed to the near ear of a character standing at (x, y)
 * (pelvis) with scale s and head turned towards screen-right (headTurn ≈ 0.2…0.6).
 */
export const PhoneAtEar: React.FC<{x: number; y: number; s: number; d?: Design; headTurn?: number}> = ({x, y, s, d = ARTEM, headTurn = 0.35}) => {
  const k = s * d.height;
  const b = headTurn * 0.82;
  const ex = x + (-72 * Math.cos(b) + Math.sin(b) * 6) * k;
  const ey = y - 418 * k;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${ex} ${ey}) rotate(-14) scale(${k})`}>
        <rect x={-20} y={-44} width={24} height={86} rx={7} fill="#0c0d10" stroke="#3a3f48" strokeWidth={1.5} />
        {/* hand wrapped around the phone */}
        <path d="M-26 6 Q-34 40 -18 66 L10 74 Q20 50 10 20 Q4 -4 -10 -8Z" fill={d.skin} stroke="#3a2318" strokeOpacity={0.45} strokeWidth={1.4} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M4 ${-6 + i * 14} q12 2 12 8 q-2 6 -12 6Z`} fill={d.skin} stroke="#3a2318" strokeOpacity={0.4} strokeWidth={1.2} />
        ))}
        <path d="M-18 66 L10 74 L14 130 L-24 126Z" fill={d.colors.top} />
      </g>
    </svg>
  );
};
