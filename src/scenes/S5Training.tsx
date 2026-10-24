// Scene 5 — training centre: bus arrives → recruits step out, Gleb looks
// around → parade ground, he asks about drone training → instructor →
// Gleb's confusion while recruits run past.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer, Svg} from '../camera/Camera';
import {BarrackDefs, Barracks, Bus, Fence, OvercastSky, ParadeGround, Watchtower} from './backgrounds/Base';
import {FarTreeline} from './backgrounds/War';
import {Dust, Fog, Grade, Grain, Vignette} from '../effects/Atmosphere';
import {Character} from '../characters/Character';
import {GLEB_CIVIL, GLEB_RECRUIT, INSTRUCTOR, RECRUITS, SOLDIERS} from '../characters/designs';
import {Design, Light} from '../characters/types';
import {alive, exprTrack, lipSync, pose, withExpr} from '../animation/performance';
import {clamp, ease, kf, ramp} from '../animation/core';
import {run, walk} from '../animation/cycles';
import {ev} from '../data';

const S = 's5_training';
export const LIGHT_OVERCAST: Light = {x: -0.35, y: -1, rim: '#e3e9ec', rimStrength: 0.35, shade: '#36424c', shadeStrength: 0.45};

export const S5Training: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const shot = t < 5 ? 0 : t < 9.5 ? 1 : t < 13.3 ? 2 : t < 15.6 ? 3 : 4;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <BarrackDefs />
      {shot === 0 && <Arrival f={f} t={t} />}
      {shot === 1 && <StepOut f={f} t={t} />}
      {shot === 2 && <Question f={f} t={t} />}
      {shot === 3 && <Instructor f={f} t={t} />}
      {shot === 4 && <Confused f={f} t={t} />}
      <Grade shadow="#2b3a46" highlight="#dfe8ee" shadowOp={0.32} highlightOp={0.05} />
      <Vignette strength={0.5} color="10,16,22" />
      <Grain opacity={0.09} />
    </AbsoluteFill>
  );
};

const Exterior: React.FC<{id: string}> = ({id}) => (
  <>
    <Layer depth={0.2}>
      <OvercastSky id={`${id}s`} />
    </Layer>
    <Layer depth={0.4}>
      <Svg>
        <FarTreeline y={940} color="#4f5a55" seed={5} height={90} />
        <Barracks x={170} y={620} w={760} h={360} sign />
        <Watchtower x={1010} y={1000} s={0.9} />
        <Fence y={1010} />
      </Svg>
    </Layer>
    <Layer depth={0.6}>
      <ParadeGround y={1000} id={`${id}p`} />
    </Layer>
  </>
);

/** Bus x position over time (decelerating arrival). */
const busX = (t: number) => kf(t, [[0, 1700], [ev(S, 'brake'), 600, ease.out]]);

const Arrival: React.FC<{f: number; t: number}> = ({t}) => {
  const k = ease.cam(clamp(t / 5));
  const cam = {x: 40 * k, y: 0, zoom: 1.02 + 0.05 * k, rot: 0, shake: 0};
  const b = ev(S, 'brake');
  const x = busX(t);
  const pitch = t > b ? -2.2 * Math.exp(-(t - b) * 3) * Math.cos((t - b) * 9) : 0.3;
  const door = ramp(t, ev(S, 'door'), ev(S, 'door') + 0.6, ease.out);
  return (
    <CameraRig cam={cam}>
      <Exterior id="a" />
      <Layer depth={0.85}>
        <Svg>
          <Bus x={x} y={1400} s={1.25} doorOpen={door} dist={1700 - x} pitch={pitch} />
        </Svg>
      </Layer>
      <Layer depth={1.1}>
        <Fog y={1150} height={400} color="190,198,202" opacity={0.25} />
      </Layer>
      <Dust count={20} color="#e8eef2" opacity={0.25} size={2} seed={3} speed={1.5} />
    </CameraRig>
  );
};

const Walker: React.FC<{d: Design; x0: number; speed: number; start: number; t: number; f: number; y: number; s: number; seed: number; look?: number; idp: string; turn?: number}> = ({
  d,
  x0,
  speed,
  start,
  t,
  f,
  y,
  s,
  seed,
  look = 0,
  idp,
  turn = -0.55,
}) => {
  const lt = Math.max(0, t - start);
  const moving = t >= start;
  const x = x0 - lt * speed;
  const phase = (lt * speed) / (300 * s);
  const c = walk(phase, moving ? 1 : 0);
  let p = pose({bodyTurn: turn, headTurn: turn + look, legL: c.legL, legR: c.legR, armL: c.armL, armR: c.armR, lean: -c.lean});
  p = alive(p, f, {seed});
  return <Character design={d} pose={p} light={LIGHT_OVERCAST} x={x} y={y + c.bob * s} scale={s} idp={idp} shadow />;
};

const StepOut: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 5;
  const cam = {x: -30 * lt, y: 0, zoom: 1.0 + 0.02 * lt, rot: 0, shake: 0};
  // Gleb stops and looks around
  const gStart = 5.6;
  const stop = 7.4;
  const gx = kf(t, [[gStart, 840], [stop, 470, ease.out]]);
  const walking = t > gStart && t < stop;
  const c = walk(((t - gStart) * 210) / 300, walking ? 1 : ramp(t, stop, stop + 0.3) * 0);
  const look = t > stop ? Math.sin((t - stop) * 2.4) * 0.9 : 0;
  const e = exprTrack(f, [
    [0, 'interest'],
    [Math.round(stop * 30) - 150, 'confusion', 20],
  ]);
  let g = pose({bodyTurn: walking ? -0.55 : -0.3, headTurn: (walking ? -0.55 : -0.2) + look, eyeX: look * 0.6, legL: c.legL, legR: c.legR, armL: {...c.armL, shoulder: c.armL.shoulder}, armR: c.armR, lean: -c.lean});
  g = withExpr(g, e);
  g = alive(g, f, {seed: 51});
  return (
    <CameraRig cam={cam}>
      <Exterior id="b" />
      <Layer depth={0.85}>
        <Svg>
          <Bus x={1200} y={1430} s={1.3} doorOpen={1} dist={0} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Walker d={RECRUITS[0]} x0={780} speed={230} start={5.0} t={t} f={f} y={1430} s={0.62} seed={61} idp="r0" />
          <Walker d={RECRUITS[2]} x0={820} speed={220} start={6.6} t={t} f={f} y={1440} s={0.63} seed={62} idp="r2" />
          <Character design={GLEB_CIVIL} pose={g} light={LIGHT_OVERCAST} x={gx} y={1460 + (walking ? c.bob * 0.66 : 0)} scale={0.66} idp="g5b" shadow />
          <Walker d={RECRUITS[4]} x0={860} speed={240} start={8.2} t={t} f={f} y={1450} s={0.64} seed={63} idp="r4" />
        </Svg>
      </Layer>
      <Layer depth={1.15}>
        <Fog y={1500} height={300} color="190,198,202" opacity={0.18} />
      </Layer>
    </CameraRig>
  );
};

/** Column of recruits running across the background. */
const RunningColumn: React.FC<{t: number; f: number; y: number; s: number; dir?: number; count?: number; blur?: boolean}> = ({t, f, y, s, dir = 1, count = 6}) => (
  <>
    {Array.from({length: count}).map((_, i) => {
      const speed = 420 * s;
      const span = 2600;
      const x = dir > 0 ? ((t * speed + i * 160 * s * 1.7) % span) - 600 : 1680 - (((t * speed + i * 160 * s * 1.7) % span) - 0);
      const c = run(t * 1.6 + i * 0.37, 1);
      const d = [RECRUITS[1], RECRUITS[3], SOLDIERS[0], RECRUITS[5], SOLDIERS[2], RECRUITS[0]][i % 6];
      let p = pose({bodyTurn: dir * 0.85, headTurn: dir * 0.85, legL: c.legL, legR: c.legR, armL: c.armL, armR: c.armR, lean: dir * c.lean});
      p = alive(p, f, {seed: 70 + i});
      return <Character key={i} design={{...d, outfit: 'field'}} pose={p} light={LIGHT_OVERCAST} x={x} y={y + c.bob * s} scale={s} idp={`rc${i}`} />;
    })}
  </>
);

const Question: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 9.5;
  const cam = {x: 0, y: 0, zoom: 1.0 + 0.05 * ease.cam(clamp(lt / 3.8)), rot: 0, shake: 0};
  const ls = lipSync(S, 's5_g1', f);
  const e = exprTrack(f, [
    [0, 'interest'],
    [Math.round(10.2 * 30), 'interest', 6],
  ]);
  let g = pose({bodyTurn: 0.45, headTurn: 0.5, eyeX: 0.5, eyeY: -0.2, armL: {shoulder: 6, elbow: 14, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 26 * ls.amount, elbow: 50 * ls.amount + 10, wrist: 0, hand: ls.talking ? 'open' : 'relaxed'}});
  g = withExpr(g, e);
  g.browWorry = 0.25;
  g = alive(g, f, {seed: 52, headMotion: ls.talking ? 1.6 : 1});
  let ins = pose({bodyTurn: -0.75, headTurn: -0.85, eyeX: -0.4, armL: {shoulder: -10, elbow: 30, wrist: 0, hand: 'fist'}, armR: {shoulder: -10, elbow: 30, wrist: 0, hand: 'fist'}});
  ins = withExpr(ins, 'stern', 0.6);
  ins = alive(ins, f, {seed: 53});
  return (
    <CameraRig cam={cam}>
      <Exterior id="c" />
      <Layer depth={0.75} blur={3}>
        <Svg>
          <RunningColumn t={t} f={f} y={1240} s={0.42} dir={1} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_RECRUIT} pose={g} mouth={ls.mouth} light={LIGHT_OVERCAST} x={380} y={1860} scale={1.75} idp="g5c" legs={false} />
        </Svg>
      </Layer>
      <Layer depth={1.25} blur={5}>
        <Svg>
          <Character design={INSTRUCTOR} pose={ins} light={LIGHT_OVERCAST} x={1040} y={2150} scale={2.4} idp="ins0" legs={false} />
        </Svg>
      </Layer>
    </CameraRig>
  );
};

const Instructor: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 13.3;
  const cam = {x: 0, y: 0, zoom: 1.0 + 0.03 * lt, rot: 0, shake: 0};
  const ls = lipSync(S, 's5_i1', f);
  const turnAway = ramp(t, 15.0, 15.55, ease.inOut);
  let ins = pose({bodyTurn: -0.4 + turnAway * 0.9, headTurn: -0.45 + turnAway * 1.2, eyeX: -0.3, headNod: -0.1, armL: {shoulder: 0, elbow: 20, wrist: 0, hand: 'fist'}, armR: {shoulder: 0, elbow: 20, wrist: 0, hand: 'fist'}});
  ins = withExpr(ins, 'stern');
  ins = alive(ins, f, {seed: 54});
  return (
    <CameraRig cam={cam}>
      <Exterior id="d" />
      <Layer depth={0.75} blur={4}>
        <Svg>
          <RunningColumn t={t} f={f} y={1250} s={0.42} dir={-1} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={INSTRUCTOR} pose={ins} mouth={ls.mouth} light={LIGHT_OVERCAST} x={560} y={1980} scale={2.15} idp="ins1" legs={false} />
        </Svg>
      </Layer>
    </CameraRig>
  );
};

const Confused: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 15.6;
  const cam = {x: 0, y: 0, zoom: 1.0 + 0.1 * ease.cam(clamp(lt / 4.4)), rot: 0, shake: 0};
  const wh = ev(S, 'whistle');
  const look = ramp(t, wh + 0.15, wh + 0.5, ease.out) * (1 - ramp(t, wh + 1.6, wh + 2.2));
  const lf = Math.round(lt * 30);
  const e = exprTrack(lf, [
    [0, 'confusion'],
    [60, 'anxiety', 40],
  ]);
  let g = pose({bodyTurn: 0.3, headTurn: 0.25 - look * 0.8, eyeX: -look * 0.9, eyeY: 0.1});
  g = withExpr(g, e);
  g = alive(g, f, {seed: 55, blinkExtra: [Math.round((wh + 0.1) * 30) - 468]});
  return (
    <CameraRig cam={cam}>
      <Exterior id="e" />
      <Layer depth={0.8} blur={5}>
        <Svg>
          <RunningColumn t={t} f={f} y={1500} s={0.75} dir={1} count={5} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_RECRUIT} pose={g} light={LIGHT_OVERCAST} x={560} y={2140} scale={3.1} idp="g5e" legs={false} />
        </Svg>
      </Layer>
    </CameraRig>
  );
};
