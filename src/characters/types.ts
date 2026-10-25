// Character rig data model. A character = Design (who they are, fixed for the
// whole series) + Pose (what they are doing on this frame).

export type Viseme = 'X' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type HairStyle = 'gleb' | 'buzz' | 'neat' | 'side' | 'grey' | 'curly' | 'long' | 'bun';
export type Hat = 'driver_cap' | 'fedora' | 'beanie';
export type Outfit =
  | 'gleb_civil'
  | 'gleb_military'
  | 'officer_dress'
  | 'field'
  | 'commander'
  | 'student_hoodie'
  | 'student_shirt'
  | 'student_sweater'
  | 'soldier'
  | 'driver'
  | 'coat'
  | 'woman_coat';

export type Design = {
  id: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  hairLight: string;
  hairStyle: HairStyle;
  iris: string;
  eyeScale: number; // 1 = Gleb
  browThick: number;
  browColor: string;
  faceWidth: number; // 1 = Gleb
  jaw: number; // 0 soft … 1 square
  age: number; // 0 young … 1 old (lines)
  mustache?: boolean;
  stubble?: boolean;
  glasses?: boolean;
  hat?: Hat;
  hatColor?: string;
  scarf?: string;
  outfit: Outfit;
  colors: {
    top: string; // main garment
    topShade: string;
    under: string; // undershirt / hoodie
    underShade: string;
    pants: string;
    pantsShade: string;
    shoes: string;
    accent: string;
  };
  bodyWidth: number; // 1 = Gleb (slim)
  height: number; // 1 = Gleb
};

export type Arm = {
  shoulder: number; // deg, 0 = hanging down, + = forward/up (towards facing)
  elbow: number; // deg bend
  wrist: number;
  hand: HandPose;
};

export type Leg = {hip: number; knee: number; foot: number};

export type HandPose = 'relaxed' | 'fist' | 'open' | 'point' | 'hold' | 'type';

export type Pose = {
  bodyTurn: number; // -1..1 (+ = facing screen-right)
  lean: number; // deg torso lean
  breathe: number; // 0..1
  shoulderUp: number; // 0..1 (tension / shrug)
  headTurn: number; // -1..1
  headTilt: number; // deg roll
  headNod: number; // -1..1 (+ = look down)
  eyeX: number; // -1..1
  eyeY: number; // -1..1 (+ = down)
  blink: number; // 0..1
  squint: number; // 0..1 lower lid raise
  lidDrop: number; // 0..1 upper lid lowered (tired/sad)
  browL: number; // -1..1 raise
  browR: number;
  browWorry: number; // inner ends up (+) / angry (-)
  smile: number; // -1..1
  mouth: Viseme;
  jaw: number; // extra jaw open 0..1
  pupil: number; // pupil scale (fear = small)
  sweat: number; // 0..1
  armL: Arm; // character's left = screen right when facing camera
  armR: Arm;
  legL: Leg;
  legR: Leg;
  hairWind: number; // secondary motion offset
  dirt: number; // 0..1 dirt on face (war scenes)
  helmet: boolean;
  cap: boolean;
};

export const restArm = (): Arm => ({shoulder: 4, elbow: 8, wrist: 0, hand: 'relaxed'});

export const basePose = (): Pose => ({
  bodyTurn: 0.35,
  lean: 0,
  breathe: 0.5,
  shoulderUp: 0,
  headTurn: 0.35,
  headTilt: 0,
  headNod: 0,
  eyeX: 0,
  eyeY: 0,
  blink: 0,
  squint: 0,
  lidDrop: 0,
  browL: 0,
  browR: 0,
  browWorry: 0,
  smile: 0,
  mouth: 'X',
  jaw: 0,
  pupil: 1,
  sweat: 0,
  armL: restArm(),
  armR: restArm(),
  legL: {hip: 2, knee: 0, foot: 0},
  legR: {hip: -2, knee: 0, foot: 0},
  hairWind: 0,
  dirt: 0,
  helmet: false,
  cap: false,
});

export type ExpressionName =
  | 'neutral'
  | 'joy'
  | 'interest'
  | 'doubt'
  | 'confusion'
  | 'anxiety'
  | 'fear'
  | 'tired'
  | 'stern'
  | 'shock'
  | 'sad';

export type Expression = Pick<
  Pose,
  'browL' | 'browR' | 'browWorry' | 'smile' | 'squint' | 'lidDrop' | 'pupil' | 'jaw'
>;

export const EXPRESSIONS: Record<ExpressionName, Expression> = {
  neutral: {browL: 0, browR: 0, browWorry: 0, smile: 0, squint: 0, lidDrop: 0.08, pupil: 1, jaw: 0},
  joy: {browL: 0.35, browR: 0.35, browWorry: 0.1, smile: 0.9, squint: 0.45, lidDrop: 0, pupil: 1.05, jaw: 0.1},
  interest: {browL: 0.5, browR: 0.3, browWorry: 0, smile: 0.25, squint: 0, lidDrop: 0, pupil: 1.12, jaw: 0},
  doubt: {browL: 0.45, browR: -0.25, browWorry: 0.25, smile: -0.25, squint: 0.15, lidDrop: 0.15, pupil: 1, jaw: 0},
  confusion: {browL: 0.6, browR: 0.25, browWorry: 0.55, smile: -0.3, squint: 0, lidDrop: 0, pupil: 0.92, jaw: 0.15},
  anxiety: {browL: 0.3, browR: 0.3, browWorry: 0.85, smile: -0.45, squint: 0.1, lidDrop: 0.05, pupil: 0.9, jaw: 0},
  fear: {browL: 0.75, browR: 0.75, browWorry: 0.95, smile: -0.6, squint: 0, lidDrop: -0.1, pupil: 0.72, jaw: 0.25},
  tired: {browL: -0.1, browR: -0.1, browWorry: 0.35, smile: -0.2, squint: 0.2, lidDrop: 0.42, pupil: 1, jaw: 0},
  stern: {browL: -0.35, browR: -0.35, browWorry: -0.6, smile: -0.3, squint: 0.25, lidDrop: 0.18, pupil: 1, jaw: 0},
  shock: {browL: 0.9, browR: 0.9, browWorry: 0.6, smile: -0.4, squint: 0, lidDrop: -0.15, pupil: 0.7, jaw: 0.5},
  sad: {browL: 0.1, browR: 0.1, browWorry: 0.9, smile: -0.55, squint: 0.1, lidDrop: 0.3, pupil: 1, jaw: 0},
};

export const blendExpr = (a: Expression, b: Expression, t: number): Expression => {
  const out = {} as Expression;
  (Object.keys(a) as (keyof Expression)[]).forEach((k) => {
    out[k] = a[k] + (b[k] - a[k]) * t;
  });
  return out;
};

export type Light = {
  x: number; // -1..1 light from screen left (-) / right (+)
  y: number; // -1 above … 1 below
  rim: string; // rim light color
  rimStrength: number; // 0..1
  shade: string; // form-shadow colour
  shadeStrength: number; // 0..1
  ambient?: string; // optional multiply tint
  ambientStrength?: number;
};
