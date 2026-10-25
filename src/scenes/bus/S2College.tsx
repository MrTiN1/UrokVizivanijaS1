// Scene 2 — college (0:08–0:23): Gleb leaves the college into light rain,
// checks the phone (23:47), speeds up; tracking camera alongside.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {BuildingRow, NightSky, PAL, StreetLamp, WetStreet, blocks, lampHead} from './world/City';
import {CollegeFacade} from './world/Places';
import {PhoneInHand} from './world/Phone';
import {Glow, LightCone, Mist, Rain, Splashes, WetReflections} from '../../effects/Weather';
import {GLEB_CIVIL} from '../../characters/designs';
import {Act, L_STREET, Post, glebPose} from './common';
import {pose} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp, rand} from '../../animation/core';
import {ev} from '../../data';

const S = 's2_college';

export const LbCollege: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < ev(S, 'phoneUp') ? <Exit f={f} t={t} /> : t < ev(S, 'walkFast') ? <Phone f={f} t={t} /> : <Track f={f} t={t} />}
      <Post warm={0.07} />
    </AbsoluteFill>
  );
};

const RainLayers: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <Rain count={110} seed={1} angle={10} speed={40} length={55} width={1.3} opacity={0.22 * k} />
    <Rain count={50} seed={2} angle={12} speed={62} length={120} width={2.6} opacity={0.3 * k} blur={1.5} />
  </>
);

const Exit: React.FC<{f: number; t: number}> = ({f, t}) => {
  const door = ramp(t, ev(S, 'doorOpen'), ev(S, 'doorOpen') + 0.6);
  const ground = 1380;
  // walk: from the doorway down the steps towards camera-right
  const w0 = 1.2;
  const w1 = 5.5;
  const k = clamp((t - w0) / (w1 - w0));
  const x = lerp(540, 800, ease.inOut(k));
  const y = lerp(ground - 20, 1760, ease.inOut(k));
  const s = lerp(0.42, 0.98, ease.inOut(k));
  const phase = (t - w0) * 0.9;
  const walking = t > w0;
  const cyc = walk(phase, walking ? 0.8 : 0);
  const turn = lerp(0.1, 0.55, k);
  let g = pose({bodyTurn: turn, headTurn: turn + 0.15, lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR, headNod: -0.05});
  g = glebPose(f, g, 'neutral', 7);
  const vis = t > ev(S, 'doorOpen') + 0.2;
  const cam = {x: 30 * k, y: 40 * k, zoom: 1.02 + 0.05 * k, rot: 0, shake: 0};
  const lamp = lampHead(960, 1520, 1000, -1);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.6}>
        <NightSky horizon={900} id="s2sky" />
        <BuildingRow base={1000} blds={blocks(5, 12, -300, 1400, 300, 700)} color={PAL.bldFar} lit={0.25} winScale={0.7} haze={0.3} />
      </Layer>
      <Layer depth={1}>
        <CollegeFacade y={ground} door={door} />
        <WetStreet top={ground + 30} curb={ground + 40} lane={false} id="s2st" />
        <WetReflections ground={ground + 40} lights={[{x: 540, y: ground - 200, color: '#ffc77a', size: 140, intensity: 0.9}, {x: lamp.x, y: lamp.y, color: PAL.warm, size: 60}, {x: 200, y: ground - 700, color: '#f2b866', size: 50, intensity: 0.4}]} />
        <LightCone x={540} y={ground - 400} w0={300} w1={560} h={420} color="#ffd59a" intensity={0.5} seed={3} />
        <StreetLamp x={960} base={1520} h={1000} dir={-1} />
        <Glow x={lamp.x} y={lamp.y} r={260} color={PAL.warm} core="#fff3d6" />
        <LightCone x={lamp.x} y={lamp.y} w0={30} w1={520} h={1100} intensity={0.7} seed={4} />
        {vis ? <Act d={GLEB_CIVIL} p={g} x={x} y={y - 430 * s} s={s} id="s2g" light={L_STREET} /> : null}
        <Splashes y0={ground + 60} y1={1920} count={50} />
        <Mist y={ground} height={380} color="140,150,190" opacity={0.12} />
      </Layer>
      <Layer depth={1.3}>
        <RainLayers />
      </Layer>
    </CameraRig>
  );
};

const Phone: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'phoneUp');
  const up = ease.out(clamp(lt / 0.5));
  const bob = fbm(f / 18, 3) * 6;
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + lt * 0.015, rot: 0, shake: 0}}>
      <Layer depth={0.5} blur={18}>
        <NightSky horizon={1000} id="s2psky" />
        <BuildingRow base={1150} blds={blocks(8, 12, -300, 1400, 400, 900)} lit={0.45} />
        <WetStreet top={1150} lane id="s2pst" />
        {[[180, 700, PAL.warm], [860, 520, PAL.warm], [520, 1180, PAL.coldBlue], [300, 1300, '#ff8a5c']].map(([x, y, c], i) => (
          <Glow key={i} x={x as number} y={y as number} r={180} color={c as string} intensity={0.9} />
        ))}
      </Layer>
      <Layer depth={1}>
        <PhoneInHand x={560 + bob * 0.3} y={1180 - 600 * (1 - up) + bob} rot={-5} scale={1.2} mode="lock" time="23:47" />
        {/* raindrops on the screen */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 14}).map((_, i) => (
            <circle key={i} cx={360 + rand(i * 3.1) * 380} cy={760 + rand(i * 7.7) * 800 - 600 * (1 - up)} r={4 + rand(i) * 6} fill="#dbe8ff" opacity={0.35} />
          ))}
        </svg>
        <Glow x={560} y={1100} r={700} color="#8fb0ff" intensity={0.18} />
      </Layer>
      <Layer depth={1.4}>
        <RainLayers k={0.8} />
      </Layer>
    </CameraRig>
  );
};

const Track: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev(S, 'walkFast');
  const speed = 330; // px/s at subject depth
  const scroll = lt * speed;
  const wrap = (v: number, p: number) => ((v % p) + p) % p;
  const cyc = walk(lt * 1.25, 1.15);
  let g = pose({bodyTurn: 0.92, headTurn: 0.85, lean: cyc.lean + 3, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR, headNod: 0.06});
  g = glebPose(f, g, 'anxiety', 7, 0.5);
  const ground = 1640;
  const lamps = [0, 1, 2].map((i) => wrap(i * 700 - scroll, 2100) - 300);
  const cam = {x: fbm(f / 30, 1) * 8, y: cyc.bob * 0.3, zoom: 1.0, rot: fbm(f / 50, 2) * 0.4, shake: 0};
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.3}>
        <NightSky horizon={1100} id="s2tsky" />
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${-wrap(scroll * 0.15, 1600)}px)`}}>
          <BuildingRow base={1150} blds={blocks(12, 20, -200, 3000, 400, 900)} color={PAL.bldFar} lit={0.3} winScale={0.7} haze={0.3} />
        </div>
      </Layer>
      <Layer depth={0.7}>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${-wrap(scroll * 0.5, 2200)}px)`}}>
          <BuildingRow base={1420} blds={blocks(14, 20, -200, 3600, 500, 1100)} color={PAL.bld} lit={0.4} />
        </div>
      </Layer>
      <Layer depth={1}>
        <WetStreet top={1420} curb={1480} lane id="s2tst" />
        <WetReflections ground={1480} lights={lamps.map((x) => ({x: lampHead(x, 1500, 900).x, y: lampHead(x, 1500, 900).y, color: PAL.warm, size: 70}))} />
        {lamps.map((x, i) => (
          <React.Fragment key={i}>
            <StreetLamp x={x} base={1500} h={900} />
            <Glow x={lampHead(x, 1500, 900).x} y={lampHead(x, 1500, 900).y} r={240} color={PAL.warm} core="#fff3d6" />
            <LightCone x={lampHead(x, 1500, 900).x} y={lampHead(x, 1500, 900).y} w1={480} h={1000} intensity={0.6} seed={10 + i} />
          </React.Fragment>
        ))}
        <Act d={GLEB_CIVIL} p={g} x={470} y={ground - 430 * 0.95 + cyc.bob} s={0.95} id="s2tg" light={L_STREET} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <ellipse cx={470} cy={ground + 10} rx={140} ry={16} fill="#000" opacity={0.35} />
        </svg>
        <Splashes y0={1500} y1={1920} count={60} />
        <Mist y={1500} height={300} color="140,150,190" opacity={0.1} speed={2} />
      </Layer>
      <Layer depth={1.4}>
        <RainLayers />
      </Layer>
    </CameraRig>
  );
};
