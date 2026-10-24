// Scene 6 — assignment: dim office, commander reads the file; dialogue in
// shot/reverse-shot; the folder closes; silent extreme close-up of Gleb.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer, Svg} from '../camera/Camera';
import {OfficeRoom} from './backgrounds/Interior';
import {Dust, Grade, Grain, LightRays, Vignette} from '../effects/Atmosphere';
import {Character} from '../characters/Character';
import {COMMANDER, GLEB_RECRUIT} from '../characters/designs';
import {Light} from '../characters/types';
import {alive, exprTrack, lipSync, pose, withExpr} from '../animation/performance';
import {clamp, ease, kf, noise, ramp} from '../animation/core';
import {ev, evArr} from '../data';

const S = 's6_assignment';
const LIGHT_DESK: Light = {x: 0.7, y: 0.4, rim: '#ffc983', rimStrength: 0.6, shade: '#1d1f28', shadeStrength: 0.6};
const LIGHT_GLEB: Light = {x: -0.6, y: 0.2, rim: '#ffc983', rimStrength: 0.45, shade: '#1d1f28', shadeStrength: 0.6};

const Clock: React.FC<{x: number; y: number; r: number; t: number}> = ({x, y, r, t}) => {
  const sec = Math.floor(t + 23) * 6;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#d9d4c5" stroke="#2b2a26" strokeWidth={r * 0.12} />
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-2} y={-r * 0.85} width={4} height={r * 0.14} fill="#333" transform={`rotate(${i * 30})`} />
      ))}
      <rect x={-3} y={-r * 0.5} width={6} height={r * 0.55} fill="#222" transform="rotate(-60)" />
      <rect x={-2} y={-r * 0.75} width={4} height={r * 0.8} fill="#222" transform="rotate(48)" />
      <rect x={-1} y={-r * 0.8} width={2} height={r * 0.9} fill="#a33" transform={`rotate(${sec})`} />
    </g>
  );
};

const DeskProps: React.FC<{t: number; folderClose: number; flips: number[]}> = ({t, folderClose, flips}) => {
  // page flips: a sheet rotates over
  const flip = flips.map((ft) => clamp((t - ft) / 0.45)).find((u) => u > 0 && u < 1) ?? 0;
  const closeU = ramp(t, folderClose - 0.35, folderClose, ease.in);
  return (
    <g>
      <path d="M-200 1360 L1280 1360 L1280 2100 L-200 2100Z" fill="#3a2a1e" />
      <rect x={-200} y={1352} width={1480} height={16} fill="#5c4330" />
      {/* lamp */}
      <g transform="translate(860 1350)">
        <rect x={-70} y={-14} width={140} height={20} rx={8} fill="#2d2a22" />
        <rect x={-6} y={-200} width={12} height={190} fill="#8a7a52" />
        <path d="M-110 -200 Q0 -280 110 -200 L90 -170 L-90 -170Z" fill="#2f5a3a" />
        <ellipse cx={0} cy={-170} rx={88} ry={12} fill="#ffe1a3" />
      </g>
      {/* folder (closing) */}
      <g transform="translate(420 1420)">
        <path d="M-230 -40 L230 -40 L260 60 L-260 60Z" fill="#7a5a30" />
        <g transform={`scale(1 ${1 - closeU * 2})`} style={{transformOrigin: '0px -40px'}}>
          <path d="M-220 -40 L220 -40 L246 50 L-246 50Z" fill="#efe9da" />
          {Array.from({length: 4}).map((_, i) => (
            <rect key={i} x={-180} y={-24 + i * 16} width={300 + (i % 2) * 50} height={5} fill="#8f897d" />
          ))}
        </g>
        {flip > 0 ? <path d={`M0 -40 L${220 * Math.cos(flip * Math.PI)} ${-40 - 40 * Math.sin(flip * Math.PI)} L${246 * Math.cos(flip * Math.PI)} ${50 - 60 * Math.sin(flip * Math.PI)} L0 50Z`} fill="#f7f2e6" /> : null}
        {closeU > 0.5 ? <path d="M-232 -46 L232 -46 L262 56 L-262 56Z" fill="#8a6a3a" stroke="#4b3720" strokeWidth={3} /> : null}
      </g>
      <rect x={120} y={1380} width={130} height={70} rx={10} fill="#1d1d1d" />
    </g>
  );
};

export const S6Assignment: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const shot = t < 3.2 ? 0 : t < 6.9 ? 1 : t < 11.6 ? 2 : t < 14.2 ? 3 : 4;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shot === 0 && <Wide f={f} t={t} />}
      {(shot === 1 || shot === 3) && <CommanderShot f={f} t={t} />}
      {shot === 2 && <GlebShot f={f} t={t} />}
      {shot === 4 && <Silence f={f} t={t} />}
      <Grade shadow="#151a24" highlight="#ffbf70" shadowOp={0.38} highlightOp={0.05} />
      <Vignette strength={0.75} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

const commanderPose = (f: number, t: number) => {
  const c1 = lipSync(S, 's6_c1', f);
  const c2 = lipSync(S, 's6_c2', f);
  const look = ramp(t, 3.3, 3.7, ease.out) * (1 - ramp(t, 6.2, 6.8));
  const readFlip = evArr(S, 'pageFlip').some((ft) => t > ft - 0.2 && t < ft + 0.6);
  let p = pose({
    bodyTurn: -0.25,
    headTurn: -0.2,
    headNod: 0.55 - look * 0.6 - (t > 11.8 && t < 13.8 ? 0.2 : 0),
    eyeY: 0.7 - look * 0.9,
    armL: {shoulder: 18, elbow: 40 + (readFlip ? 25 : 0), wrist: 0, hand: 'relaxed'},
    armR: {shoulder: 14, elbow: 38, wrist: 0, hand: 'relaxed'},
  });
  p = withExpr(p, 'stern', 0.85);
  p = alive(p, f, {seed: 81, headMotion: 0.6, saccadeAmp: 0.04});
  const mouth = c1.talking ? c1.mouth : c2.mouth;
  return {p, mouth};
};

const Wide: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = ease.cam(clamp(t / 3.2));
  const cam = {x: 0, y: 0, zoom: 1.04 + 0.05 * k, rot: 0, shake: 0};
  const {p, mouth} = commanderPose(f, t);
  let g = pose({bodyTurn: 0.8, headTurn: 0.75, eyeX: 0.4, armL: {shoulder: 0, elbow: 6, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 0, elbow: 6, wrist: 0, hand: 'relaxed'}});
  g = withExpr(g, 'neutral');
  g = alive(g, f, {seed: 82});
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.6}>
        <OfficeRoom dark={1} lamp={0.9} />
        <Svg>
          <Clock x={300} y={420} r={60} t={t} />
        </Svg>
        <LightRays origin={[1010, 420]} angle={150} count={4} length={1300} spread={18} opacity={0.12} color="#cfd8e6" />
      </Layer>
      <Layer depth={0.85}>
        <Svg>
          <Character design={COMMANDER} pose={p} mouth={mouth} light={LIGHT_DESK} x={560} y={1650} scale={1.3} idp="cm0" legs={false} />
          <g transform="translate(110 292) scale(0.8)">
            <DeskProps t={t} folderClose={ev(S, 'folderClose')} flips={evArr(S, 'pageFlip')} />
          </g>
        </Svg>
      </Layer>
      <Layer depth={1.2} blur={3}>
        <Svg>
          <Character design={GLEB_RECRUIT} pose={g} light={LIGHT_GLEB} x={130} y={2180} scale={1.9} idp="g6w" legs={false} />
        </Svg>
      </Layer>
      <Dust count={26} color="#ffd9a0" opacity={0.35} size={2} seed={11} speed={0.3} area={[300, 700, 700, 800]} />
    </CameraRig>
  );
};

const CommanderShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const second = t >= 11.6;
  const lt = t - (second ? 11.6 : 3.2);
  const cam = {x: 0, y: 0, zoom: 1.0 + 0.04 * lt, rot: 0, shake: 0};
  const {p, mouth} = commanderPose(f, t);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5} blur={8}>
        <OfficeRoom dark={1} lamp={0.9} id="of6b" />
        <Svg>
          <Clock x={240} y={520} r={60} t={t} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={COMMANDER} pose={p} mouth={mouth} light={LIGHT_DESK} x={580} y={1960} scale={2.25} idp="cm1" legs={false} />
          <g transform="translate(-260 -540) scale(1.5)">
            <DeskProps t={t} folderClose={ev(S, 'folderClose')} flips={evArr(S, 'pageFlip')} />
          </g>
        </Svg>
      </Layer>
    </CameraRig>
  );
};

const GlebShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 6.9;
  const cam = {x: 0, y: 0, zoom: 1.0 + 0.05 * ease.cam(clamp(lt / 4.7)), rot: 0, shake: 0};
  const ls = lipSync(S, 's6_g1', f);
  const step = ramp(t, 7.9, 8.4, ease.out);
  const e = exprTrack(f, [
    [0, 'shock'],
    [Math.round(7.2 * 30), 'shock', 4],
    [Math.round(7.8 * 30), 'confusion', 12],
    [Math.round(10.3 * 30), 'anxiety', 20],
  ]);
  let g = pose({bodyTurn: -0.35, headTurn: -0.35, eyeX: -0.4, eyeY: -0.1, lean: -4 * step, armR: {shoulder: 8, elbow: 12, wrist: 0, hand: 'relaxed'}, armL: {shoulder: 30 * step + 4, elbow: 70 * step + 8, wrist: 0, hand: step > 0.4 ? 'open' : 'relaxed'}});
  g = withExpr(g, e);
  g = alive(g, f, {seed: 83, headMotion: ls.talking ? 1.5 : 1});
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5} blur={9}>
        <OfficeRoom dark={1} lamp={0.7} id="of6c" />
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_RECRUIT} pose={g} mouth={ls.mouth} light={LIGHT_GLEB} x={540 - step * 20} y={1990} scale={2.4 + step * 0.08} idp="g6c" legs={false} />
        </Svg>
      </Layer>
    </CameraRig>
  );
};

const Silence: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 14.2;
  const cam = {x: 0, y: -40 * ease.cam(clamp(lt / 5.8)), zoom: 1.0 + 0.16 * ease.cam(clamp(lt / 5.8)), rot: 0, shake: 0};
  const lf = Math.round(lt * 30);
  const e = exprTrack(lf, [
    [0, 'shock'],
    [30, 'sad', 60],
  ]);
  let g = pose({bodyTurn: -0.15, headTurn: -0.12, eyeX: -0.05, eyeY: 0.25, headNod: 0.12});
  g = withExpr(g, e);
  g = alive(g, f, {seed: 84, saccadeAmp: 0.03, headMotion: 0.4, breatheRate: 1.4});
  const flicker = 0.9 + 0.1 * noise(f / 3, 9);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5} blur={12}>
        <OfficeRoom dark={1} lamp={0.6 * flicker} id="of6d" />
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_RECRUIT} pose={g} light={LIGHT_GLEB} x={540} y={2480} scale={4.3} idp="g6e" legs={false} />
        </Svg>
        <AbsoluteFill style={{background: `rgba(0,0,0,${0.12 * (1 - flicker) * 5})`}} />
      </Layer>
    </CameraRig>
  );
};
void kf;
