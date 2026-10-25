// Scene 7 — the photo (1:25–1:43). Back in his seat, the phone wakes by
// itself: a new photo of Gleb in this very bus, taken at 20:47. Now it is
// 00:12. Slow push into the screen.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AisleShot} from './shots';
import {PhoneInHand} from './world/Phone';
import {GLEB_CIVIL} from '../../characters/designs';
import {Post, glebPose, seatedPose} from './common';
import {SEATING, passengers} from './S4Passengers';
import {pose} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {Glow} from '../../effects/Weather';
import {ev} from '../../data';

const S = 's7_photo';

export const LbPhoto: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3.2 ? <Back f={f} t={t} /> : <PhoneShot f={f} t={t} />}
      <Post warm={0.03} cold />
    </AbsoluteFill>
  );
};

const Back: React.FC<{f: number; t: number}> = ({f, t}) => {
  const sitT = ev(S, 'sit');
  const k = clamp(t / sitT);
  const z = lerp(1.25, SEATING.gleb.z, ease.inOut(k));
  const X = lerp(0.0, SEATING.gleb.X, ease.inOut(clamp((t - 0.6) / (sitT - 0.4))));
  const sit = clamp((t - sitT) / 0.9);
  const cyc = walk(t * 0.9, t < sitT ? 0.8 : 0);
  const turn = lerp(3.7, -0.3, ease.inOut(clamp((t - sitT + 0.5) / 1.0)));
  const seated = seatedPose(turn, {headTurn: turn, headNod: 0.25, eyeY: 0.4});
  const st = {legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR};
  const p = pose({...seated, ...(sit < 0.01 ? st : {}), lean: t < sitT ? cyc.lean : 0});
  if (sit > 0) {
    p.legL = {hip: lerp(0, 84, ease.inOut(sit)), knee: lerp(4, 88, ease.inOut(sit)), foot: 0};
    p.legR = {hip: lerp(0, 80, ease.inOut(sit)), knee: lerp(4, 84, ease.inOut(sit)), foot: 0};
  }
  const g = glebPose(f, p, 'anxiety', 7);
  const Y = lerp(0.373, 0.27, ease.inOut(sit));
  return (
    <AisleShot
      facing="rear"
      cam={{x: 80, y: 40, zoom: 1.1 + 0.05 * t / 3.2, rot: fbm(f / 40, 1) * 0.4, shake: 1.2, shakeFreq: 0.6}}
      occupants={[...passengers(f), {d: GLEB_CIVIL, p: g, X, z, Y, id: 'g7b'}]}
    />
  );
};

const PhoneShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const on = ev(S, 'screenOn');
  const screen = ramp(t, on, on + 0.25);
  const photo = ev(S, 'photo');
  const clock = ev(S, 'clock');
  const push = ev(S, 'push');
  const mode = t < on ? 'off' : t < photo ? 'lock' : t < clock ? 'photo' : t < push ? 'clock' : 'photo';
  const time = '00:12';
  const zoomIn = ease.cam(clamp((t - push) / 5.6));
  const tremble = fbm(f / 3, 4) * (2 + 3 * zoomIn);
  const sc = 1.15 + (t > photo && t < clock ? 0.1 * ramp(t, photo, clock) : 0) + 1.5 * zoomIn;
  const y = 1080 - 230 * zoomIn;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(18px) brightness(0.45)'}}>
        <AisleShot facing="rear" cam={{x: 100, y: 120, zoom: 1.5, rot: 0, shake: 0}} occupants={passengers(f)} />
      </AbsoluteFill>
      <Glow x={540} y={1000} r={760} color="#8fb0ff" intensity={0.22 * screen} />
      <PhoneInHand
        x={540 + tremble}
        y={y + tremble * 0.6}
        rot={-3 + fbm(f / 30, 2) * 1.5}
        scale={sc}
        mode={mode as 'off'}
        time={time}
        date="среда, 15 ноября"
        note="Новое фото · 20:47"
        noteOpacity={ramp(t, ev(S, 'notify'), ev(S, 'notify') + 0.3)}
        screen={mode === 'off' ? 0 : screen}
      />
      {/* Gleb's face lit by the screen, barely visible at the top edge */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 22%)'}} />
      {void pose}
    </AbsoluteFill>
  );
};
