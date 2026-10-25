// Ep2 Scene 7 — old photographs (1:25–1:43): photos pinned to the cabin wall,
// each signed with a date: the woman (20 years ago), the man in the coat
// (15 years ago) — and Gleb: «ЗАВТРА, 00:13».
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {GlebStandClose, glebStand} from './common2';
import {PHOTO_SET, PhotoCard, PhotoWall} from './world/Props';
import {Post} from '../bus/common';
import {exprTrack} from '../../animation/performance';
import {clamp, ease, fbm, lerp} from '../../animation/core';
import {flicker} from '../../effects/Weather';
import {ev} from '../../data';

const S = 'p7_photos';

const PHOTO_POS: [number, number][] = [
  [260, 760],
  [800, 820],
  [520, 1240],
];

export const PmPhotos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3 ? <Notice f={f} t={t} /> : t < ev(S, 'push') ? <Wall f={f} t={t} /> : t < 15.6 ? <Reaction f={f} t={t} /> : <Wall f={f} t={t} />}
      <Post warm={0.04} cold />
    </AbsoluteFill>
  );
};

const Notice: React.FC<{f: number; t: number}> = ({f, t}) => {
  const turn = ease.inOut(clamp((t - 0.6) / 0.9));
  const p = glebStand(f, {bodyTurn: lerp(0.1, -0.5, turn), headTurn: lerp(0.1, -0.85, turn), eyeX: -0.6, headNod: 0.02}, 'interest');
  return <GlebStandClose p={p} x={600} s={2.6} cam={{x: 0, y: 0, zoom: 1 + 0.02 * t, rot: 0, shake: 0.7, shakeFreq: 0.5}} />;
};

/** Camera moves photo to photo; the last one (Gleb) gets a slow push. */
const Wall: React.FC<{f: number; t: number}> = ({f, t}) => {
  const keys: [number, [number, number], number][] = [
    [3.0, [540, 960], 1.0],
    [3.8, PHOTO_POS[0], 2.0],
    [6.0, PHOTO_POS[0], 2.15],
    [6.8, PHOTO_POS[1], 2.0],
    [9.0, PHOTO_POS[1], 2.15],
    [9.8, PHOTO_POS[2], 2.1],
    [13.0, PHOTO_POS[2], 2.6],
    [15.6, [540, 1000], 1.1],
    [18.0, [540, 980], 1.18],
  ];
  let i = 0;
  while (i < keys.length - 1 && t > keys[i + 1][0]) i++;
  const [ta, pa, za] = keys[i];
  const [tb, pb, zb] = keys[Math.min(i + 1, keys.length - 1)];
  const u = tb > ta ? ease.inOut(clamp((t - ta) / (tb - ta))) : 1;
  const x = lerp(pa[0], pb[0], u);
  const y = lerp(pa[1], pb[1], u);
  const Z = lerp(za, zb, u);
  const fl = flicker(t, [[9.6, 9.9]], 23);
  return (
    <CameraRig cam={{x: (x - 540) * Z, y: (y - 960) * Z, zoom: Z, rot: fbm(f / 50, 2) * 0.3, shake: 0.6, shakeFreq: 0.5}}>
      <Layer depth={1}>
        <PhotoWall light={fl} />
        {PHOTO_SET.map((ph, k) => (
          <PhotoCard key={k} x={PHOTO_POS[k][0]} y={PHOTO_POS[k][1]} rot={ph.rot} d={ph.d} caption={ph.caption} id={`ph${k}`} sepia={ph.sepia} red={ph.red} />
        ))}
        <AbsoluteFill style={{background: '#000', opacity: (1 - fl) * 0.5}} />
      </Layer>
    </CameraRig>
  );
};

const Reaction: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'push');
  const e = exprTrack(Math.round(lt * 30), [
    [0, 'shock'],
    [30, 'fear', 30],
  ]);
  const p = glebStand(f, {bodyTurn: -0.4, headTurn: -0.6, eyeX: -0.5, headNod: 0.05, pupil: 0.7}, e);
  const push = ease.cam(clamp(lt / 2.6));
  return <GlebStandClose p={{...p, pupil: 0.65}} x={620} s={2.9} cam={{x: 0, y: -40 * push, zoom: 1 + 0.12 * push, rot: 0, shake: 0.6, shakeFreq: 0.4}} />;
};
