// Locomotion cycles (Walk / Run) and other reusable motion presets
// (Idle sway, Nervous fidget, Shocked recoil, Sit, Stand).
import {Pose} from '../characters/types';

const TAU = Math.PI * 2;

export type Cycle = Pick<Pose, 'legL' | 'legR' | 'armL' | 'armR' | 'lean'> & {bob: number};

/** phase in cycles (1 = two steps). Classic contact → down → passing → up. */
export const walk = (phase: number, energy = 1): Cycle => {
  const p = phase * TAU;
  const leg = (q: number) => ({
    hip: 24 * energy * Math.sin(q),
    knee: 6 + 42 * energy * Math.max(0, Math.cos(q)) ** 2,
    foot: -10 * Math.sin(q) * energy,
  });
  const arm = (q: number) => ({
    shoulder: -20 * energy * Math.sin(q),
    elbow: 14 + 12 * energy * Math.max(0, -Math.sin(q)),
    wrist: 0,
    hand: 'relaxed' as const,
  });
  return {
    legL: leg(p),
    legR: leg(p + Math.PI),
    armL: arm(p + Math.PI),
    armR: arm(p),
    lean: 2 * energy,
    bob: -7 * energy * Math.cos(2 * p),
  };
};

export const run = (phase: number, energy = 1): Cycle => {
  const p = phase * TAU;
  const leg = (q: number) => ({
    hip: 38 * energy * Math.sin(q) + 6,
    knee: 20 + 70 * energy * Math.max(0, Math.cos(q)) ** 1.5,
    foot: -14 * Math.sin(q),
  });
  const arm = (q: number) => ({
    shoulder: -38 * energy * Math.sin(q) + 8,
    elbow: 80,
    wrist: 0,
    hand: 'fist' as const,
  });
  return {legL: leg(p), legR: leg(p + Math.PI), armL: arm(p + Math.PI), armR: arm(p), lean: 9 * energy, bob: -14 * energy * Math.cos(2 * p)};
};

/** Nervous fidget: small rapid shifts in the shoulders and hands. */
export const nervous = (frame: number, amount = 1) => ({
  shoulderUp: (0.3 + 0.1 * Math.sin(frame / 7)) * amount,
  headTilt: 2 * Math.sin(frame / 11) * amount,
});

/** Seated pose (legs bent at hips and knees). */
export const sitLegs = () => ({legL: {hip: 85, knee: 88, foot: 0}, legR: {hip: 80, knee: 84, foot: 0}});
