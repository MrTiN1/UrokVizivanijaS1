// Shared helpers for episode 2 — thin layer over the episode-1 kit.
import React from 'react';
import {CameraRig, Cam, Layer} from '../../camera/Camera';
import {Act, L_BUS, glebPose} from '../bus/common';
import {AisleShot, Occupant} from '../bus/shots';
import {BOKEH_BUS, Bokeh} from '../../effects/Weather';
import {GLEB_CIVIL, OLD_WOMAN} from '../../characters/designs';
import {Light, Pose} from '../../characters/types';
import {MouthParams} from '../../characters/Head';
import {pose, withExpr} from '../../animation/performance';
import {SEATING, camOn, facePoint, passengers} from '../bus/S4Passengers';
import {frozen, seatedPose} from '../bus/common';
import {lerp} from '../../animation/core';

/** Gleb standing, framed from the chest up, out-of-focus bus behind him. */
export const GlebStandClose: React.FC<{cam?: Cam; p: Pose; mouth?: MouthParams; light?: Light; x?: number; s?: number; bg?: React.ReactNode}> = ({
  cam = {x: 0, y: 0, zoom: 1, rot: 0, shake: 0.8, shakeFreq: 0.5},
  p,
  mouth,
  light = L_BUS,
  x = 560,
  s = 2.6,
  bg,
}) => (
  <CameraRig cam={cam}>
    <Layer depth={0.5}>{bg ?? <Bokeh discs={BOKEH_BUS} top="#1a2234" bottom="#07080c" />}</Layer>
    <Layer depth={1}>
      <Act d={GLEB_CIVIL} p={p} x={x} y={960 + 436 * s - 30 * s} s={s} id="g2close" light={light} mouth={mouth} legs={false} />
    </Layer>
  </CameraRig>
);

/** Gleb standing pose with expression and life. */
export const glebStand = (f: number, over: Partial<Pose>, expr: Parameters<typeof glebPose>[2], amt = 1) => glebPose(f, pose(over), expr, 7, amt);

/** The woman's pose: frozen as in episode 1, or "awake" (raises head, blinks, talks). */
export const womanPose = (f: number, awake: number, over: Partial<Pose> = {}): Pose => {
  const base = seatedPose(0.25, {headTurn: lerp(0.1, 0.35, awake), headNod: lerp(0.32, 0.0, awake), eyeY: lerp(0.6, -0.05, awake), eyeX: lerp(0, 0.15, awake), lidDrop: lerp(0.35, 0.12, awake), ...over});
  const p = withExpr(base, 'sad', 0.4 + 0.3 * awake);
  return awake > 0.05 ? {...p, blink: 0} : frozen(p);
};

/** Rear-facing aisle with the passengers; the woman replaced by a custom pose. */
export const RearAisle: React.FC<{cam: Cam; f: number; woman?: Pose; womanMouth?: MouthParams; extra?: Occupant[]; light?: number}> = ({cam, f, woman, womanMouth, extra = [], light = 1}) => (
  <AisleShot
    facing="rear"
    light={light}
    cam={cam}
    occupants={[...passengers(f, {woman: !woman}), ...(woman ? [{d: OLD_WOMAN, p: woman, ...SEATING.woman, id: 'w2', mouth: womanMouth}] : []), ...extra]}
  />
);

export const womanCam = (Z: number, dy = 60) => {
  const fp = facePoint(SEATING.woman.X, SEATING.woman.z, OLD_WOMAN);
  return camOn(fp.x, fp.y + dy, Z);
};
