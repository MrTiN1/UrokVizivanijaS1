// Shared look & helpers for «Последний автобус»: lights, post stack
// (grade, vignette, grain, mist), common poses, reusable shots.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Grade, Grain, Vignette} from '../../effects/Atmosphere';
import {Light, Pose} from '../../characters/types';
import {alive, pose, withExpr} from '../../animation/performance';
import {ExpressionName} from '../../characters/types';
import {Character} from '../../characters/Character';
import {Design} from '../../characters/types';
import {MouthParams} from '../../characters/Head';

/** Cold white fluorescent light inside the bus (from above), blue rim. */
export const L_BUS: Light = {x: -0.3, y: -0.9, rim: '#bcd6ff', rimStrength: 0.55, shade: '#1c2238', shadeStrength: 0.5};
/** Warm sodium street lamp from above-right, cold sky rim from the left. */
export const L_STREET: Light = {x: 0.6, y: -0.7, rim: '#ffcf8a', rimStrength: 0.7, shade: '#141a30', shadeStrength: 0.6};
/** Phone glow from below (bluish). */
export const L_PHONE: Light = {x: 0.1, y: 0.9, rim: '#a9c8ff', rimStrength: 0.8, shade: '#0d1020', shadeStrength: 0.7};

export const dim = (l: Light, k: number): Light => ({...l, rimStrength: l.rimStrength * k, shadeStrength: Math.min(0.9, l.shadeStrength + (1 - k) * 0.3)});

/** Final look: blue-violet shadows, warm highlights, vignette, film grain. */
export const Post: React.FC<{warm?: number; vignette?: number; grain?: number; cold?: boolean}> = ({warm = 0.06, vignette = 0.75, grain = 0.09, cold = false}) => (
  <>
    <Grade shadow={cold ? '#18233a' : '#221d3a'} highlight={cold ? '#cfe3ff' : '#ffc78a'} shadowOp={0.42} highlightOp={warm} />
    <Vignette strength={vignette} />
    <Grain opacity={grain} />
  </>
);

/** Sitting pose with hands resting on the thighs. */
export const seatedPose = (turn: number, over: Partial<Pose> = {}): Pose =>
  pose({
    bodyTurn: turn,
    headTurn: turn,
    legL: {hip: 84, knee: 88, foot: 0},
    legR: {hip: 80, knee: 84, foot: 0},
    armL: {shoulder: 8, elbow: 70, wrist: 10, hand: 'relaxed'},
    armR: {shoulder: 4, elbow: 66, wrist: 10, hand: 'relaxed'},
    ...over,
  });

/** "Frozen" passenger: no blinking, no breathing, no saccades — the uncanny stillness. */
export const frozen = (p: Pose): Pose => ({...p, blink: 0, breathe: 0.5});

export type ActorSpec = {
  d: Design;
  p: Pose;
  x: number;
  y: number;
  s: number;
  id: string;
  light: Light;
  mouth?: MouthParams;
  legs?: boolean;
  opacity?: number;
};
/** Render one character in a full-frame SVG. */
export const Act: React.FC<ActorSpec> = ({d, p, x, y, s, id, light, mouth, legs = true, opacity}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    <Character design={d} pose={p} light={light} x={x} y={y} scale={s} idp={id} mouth={mouth} legs={legs} opacity={opacity} />
  </svg>
);

/** Gleb with life layer + expression. */
export const glebPose = (f: number, base: Pose, expr: ExpressionName | Parameters<typeof withExpr>[1], seed = 7, amt = 1) => alive(withExpr(base, expr, amt), f, {seed});

export const Letterbox: React.FC<{amount: number}> = ({amount}) =>
  amount > 0 ? (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120 * amount, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 * amount, background: '#000'}} />
    </AbsoluteFill>
  ) : null;
