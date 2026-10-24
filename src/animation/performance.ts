// Performance layer: turns a base pose + expression into a living character
// (breathing, blinking, saccades, micro head motion) and drives lip sync from
// the phoneme-aligned viseme track of a voice line.
import {Pose, Expression, EXPRESSIONS, ExpressionName, basePose, blendExpr, Viseme} from '../characters/types';
import {MouthParams, VISEME_PARAMS, mixMouth} from '../characters/Head';
import {VOICES, scene} from '../data';
import {blink, breath, fbm, saccade} from './core';

export const FPS = 30;

/** Mouth shape for a voice line at scene-local frame. Smoothly blends visemes. */
export const lipSync = (sceneId: string, lineId: string, frame: number): {mouth: MouthParams; talking: boolean; amount: number} => {
  const ln = scene(sceneId).lines.find((l) => l.id === lineId)!;
  const info = VOICES[lineId];
  const t = frame / FPS - ln.at;
  const rest = VISEME_PARAMS.X;
  if (!info || t < -0.05 || t > info.duration + 0.05) return {mouth: rest, talking: false, amount: 0};
  const cues = info.visemes;
  const at = (tt: number): MouthParams => {
    const c = cues.find((q) => tt >= q.start && tt < q.end);
    return VISEME_PARAMS[(c?.v ?? 'X') as Viseme] ?? rest;
  };
  // anticipate by 1 frame (mouth leads sound slightly), blend with neighbours
  const lead = t + 1 / FPS;
  const m0 = at(lead - 1 / FPS);
  const m1 = at(lead);
  const m2 = at(lead + 1 / FPS);
  const mouth = mixMouth(mixMouth(m0, m2, 0.5), m1, 0.6);
  return {mouth, talking: true, amount: Math.min(1, t / 0.1)};
};

/** Talking energy (for head bobs / gestures) from viseme openness. */
export const talkEnergy = (sceneId: string, lineId: string, frame: number) => {
  const r = lipSync(sceneId, lineId, frame);
  return r.talking ? r.mouth.open : 0;
};

type AliveOpts = {
  seed?: number;
  blinkExtra?: number[];
  gaze?: [number, number];
  saccadeAmp?: number;
  breatheRate?: number;
  headMotion?: number;
};

/** Adds the "life" layer to a pose. */
export const alive = (p: Pose, frame: number, o: AliveOpts = {}): Pose => {
  const seed = o.seed ?? 1;
  const hm = o.headMotion ?? 1;
  return {
    ...p,
    breathe: breath(frame, seed, o.breatheRate ?? 1),
    blink: Math.max(p.blink, blink(frame, seed, FPS, o.blinkExtra ?? [])),
    eyeX: p.eyeX + saccade(frame, seed, o.saccadeAmp ?? 0.12),
    eyeY: p.eyeY + saccade(frame, seed + 5, (o.saccadeAmp ?? 0.12) * 0.5),
    headTilt: p.headTilt + fbm(frame / 70, seed + 2) * 1.6 * hm,
    headTurn: p.headTurn + fbm(frame / 90, seed + 4) * 0.025 * hm,
    headNod: p.headNod + fbm(frame / 80, seed + 6) * 0.05 * hm,
    hairWind: p.hairWind + fbm(frame / 25, seed + 8) * 0.4,
  };
};

export const withExpr = (p: Pose, e: ExpressionName | Expression, amount = 1): Pose => {
  const ex = typeof e === 'string' ? EXPRESSIONS[e] : e;
  const cur: Expression = {browL: p.browL, browR: p.browR, browWorry: p.browWorry, smile: p.smile, squint: p.squint, lidDrop: p.lidDrop, pupil: p.pupil, jaw: p.jaw};
  return {...p, ...blendExpr(cur, ex, amount)};
};

/** Crossfade between expressions over time: keys = [frame, expression]. */
export const exprTrack = (frame: number, keys: [number, ExpressionName, number?][]): Expression => {
  let cur = EXPRESSIONS[keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    const [f, name, dur = 10] = keys[i];
    if (frame < f) break;
    const t = Math.min(1, (frame - f) / dur);
    const ease = t * t * (3 - 2 * t);
    cur = blendExpr(cur, EXPRESSIONS[name], ease);
  }
  return cur;
};

export const pose = (over: Partial<Pose> = {}): Pose => ({...basePose(), ...over});
