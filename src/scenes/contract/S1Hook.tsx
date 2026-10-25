// Scene 1 — hook: Gleb in the burnt tree belt at dusk. Slow push-in to his
// face, distant blasts, series title slam, whip transition to the past.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {FarTreeline, Ground, TreeLayer, WarSky, treeRow} from './backgrounds/War';
import {Embers, Fog, Grade, Grain, Smoke, Vignette, Flash, Dust} from '../../effects/Atmosphere';
import {Actor} from '../../components/Actor';
import {GLEB_MILITARY} from '../../characters/designs';
import {Light} from '../../characters/types';
import {alive, pose, withExpr, exprTrack} from '../../animation/performance';
import {clamp, ease, kf, ramp} from '../../animation/core';
import {SeriesTitle} from '../../components/Title';
import {EPISODE, ev} from '../../data';

const S = 's1_hook';
const NEAR = treeRow(5, 1290, 700, 1050, 26, 40, 3);
const MID = treeRow(9, 1180, 380, 620, 12, 22, 7);
const FAR = treeRow(14, 1150, 180, 320, 5, 10, 11);
const FG = [
  {x: -40, base: 2050, h: 1500, w: 90, seed: 901, lean: 0.05},
  {x: 1130, base: 2100, h: 1300, w: 80, seed: 902, lean: -0.08},
];

export const LIGHT_WAR: Light = {x: 0.75, y: -0.1, rim: '#ff8a3d', rimStrength: 0.75, shade: '#18202e', shadeStrength: 0.6};

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const boom1 = ev(S, 'boom1');
  const boom2 = ev(S, 'boom2');
  const hit = ev(S, 'titleHit');
  const wh = ev(S, 'whoosh');
  // camera: slow dolly-in to the face, shake on blasts, whip-pan out
  const push = ease.cam(clamp(t / 5.6));
  const shake = 6 * Math.max(0, 1 - Math.abs(t - boom1 - 0.15) / 0.6) + 4 * Math.max(0, 1 - Math.abs(t - hit) / 0.5) + 3 * Math.max(0, 1 - Math.abs(t - boom2 - 0.1) / 0.6);
  const whip = ease.in(clamp((t - wh) / 0.55));
  const cam = {x: 20 * push + whip * 1600, y: -60 * push, zoom: 1 + 0.42 * push, rot: whip * 4, shake};
  // Gleb performance
  const flinch = ramp(t, boom1 + 0.05, boom1 + 0.3, ease.out) * (1 - ramp(t, boom1 + 0.9, boom1 + 1.8));
  const e = exprTrack(f, [
    [0, 'tired'],
    [Math.round((boom1 + 0.1) * 30), 'anxiety', 8],
    [Math.round((boom1 + 2.0) * 30), 'tired', 30],
  ]);
  let p = pose({
    bodyTurn: 0.22,
    headTurn: 0.18 - flinch * 0.5,
    eyeX: -flinch * 0.6,
    helmet: true,
    dirt: 1,
    shoulderUp: flinch * 0.6,
    armL: {shoulder: 4, elbow: 12, wrist: 0, hand: 'fist'},
    armR: {shoulder: 6, elbow: 14, wrist: 0, hand: 'fist'},
  });
  p = withExpr(p, e);
  p = alive(p, f, {seed: 4, blinkExtra: [Math.round((boom1 + 0.06) * 30)], breatheRate: 1.3});
  const dim = 1 - ramp(t, wh, wh + 0.5) * 0.5;
  const titleOut = ramp(t, wh - 0.1, wh + 0.3);
  return (
    <AbsoluteFill style={{background: '#000', filter: `blur(${whip * 18}px) brightness(${dim})`}}>
      <CameraRig cam={cam}>
        <Layer depth={0.15}>
          <WarSky horizon={1150} />
        </Layer>
        <Layer depth={0.25}>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <FarTreeline y={1160} color="#2a2b30" seed={2} />
          </svg>
          <TreeLayer trees={FAR} color="#24252b" rim="#a85a32" />
        </Layer>
        <Layer depth={0.35}>
          <Smoke y={1020} color="#4a4140" opacity={0.45} seed={5} speed={0.6} size={300} />
        </Layer>
        <Layer depth={0.45}>
          <TreeLayer trees={MID} color="#18191d" rim="#c46a35" />
          <Ground y={1250} />
        </Layer>
        <Layer depth={0.6}>
          <TreeLayer trees={NEAR} color="#101114" rim="#d27238" />
          <Fog y={1350} height={360} color="120,110,110" opacity={0.3} />
        </Layer>
        <Layer depth={0.75}>
          <Smoke y={1350} color="#2e2a2a" opacity={0.4} seed={9} speed={1} size={260} />
        </Layer>
        <Layer depth={1} style={{filter: 'brightness(0.74) saturate(0.82) contrast(1.05)'}}>
          <Actor design={GLEB_MILITARY} pose={p} light={LIGHT_WAR} x={560} y={2000} scale={2.55} idp="g1" legs={false} />
        </Layer>
        <Layer depth={1.25}>
          <Embers count={30} seed={4} />
        </Layer>
        <Layer depth={1.6} blur={10}>
          <TreeLayer trees={FG} color="#060607" rim="#5a3020" />
        </Layer>
      </CameraRig>
      <Dust count={30} color="#ffd2a0" opacity={0.35} size={2} seed={8} />
      <Grade shadow="#1d2a3e" highlight="#ff9a50" shadowOp={0.35} highlightOp={0.06} />
      <Vignette strength={0.75} />
      <Flash amount={0.12 * Math.max(0, 1 - Math.abs(t - boom1 - 0.1) / 0.25)} color="#ffb070" />
      <SeriesTitle t={t - hit} series={EPISODE.series} sub={`СЕРИЯ ${EPISODE.number} — ГЛЕБ`} top={210} out={titleOut} />
      <Flash amount={0.55 * ramp(t, wh + 0.3, wh + 0.55)} color="#f6e7cf" />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
void kf;
