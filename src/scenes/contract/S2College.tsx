// Scene 2 — college: wide classroom → hands on keyboard → screen → close-up
// with classmate Artyom. Warm daylight palette.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer, Svg} from '../../camera/Camera';
import {ClassroomWall, CodeScreenLines, Desk, Keyboard, Monitor} from './backgrounds/Interior';
import {Dust, Flash, Grade, Grain, LightRays, Vignette} from '../../effects/Atmosphere';
import {Character} from '../../characters/Character';
import {Hand} from '../../characters/Body';
import {CLASSMATE, GLEB_CIVIL, STUDENTS} from '../../characters/designs';
import {Light, Pose} from '../../characters/types';
import {alive, exprTrack, pose, withExpr} from '../../animation/performance';
import {clamp, ease, fbm, kf, noise, ramp, rand} from '../../animation/core';
import {VISEME_PARAMS} from '../../characters/Head';

export const LIGHT_DAY: Light = {x: -0.8, y: -0.4, rim: '#fff0cf', rimStrength: 0.45, shade: '#7b5a52', shadeStrength: 0.32};
const LIGHT_SCREEN: Light = {x: 0.85, y: 0, rim: '#bfe3ff', rimStrength: 0.55, shade: '#5d4f5e', shadeStrength: 0.38};

const typingArms = (f: number, on: boolean, seed = 1): Pick<Pose, 'armL' | 'armR'> => {
  const b1 = on ? Math.abs(Math.sin(f * 1.7 + seed)) * 6 : 0;
  const b2 = on ? Math.abs(Math.sin(f * 1.3 + 2 + seed)) * 6 : 0;
  return {
    armL: {shoulder: 38 + b1 * 0.3, elbow: 62 + b1, wrist: -10, hand: 'type'},
    armR: {shoulder: 42 + b2 * 0.3, elbow: 58 + b2, wrist: -10, hand: 'type'},
  };
};

const isTyping = (t: number) => [[1.0, 4.3], [4.5, 7.9], [8.2, 11.2], [12.0, 13.2]].some(([a, b]) => t >= a && t < b);

const Student: React.FC<{d: (typeof STUDENTS)[number]; x: number; y: number; s: number; f: number; seed: number; turn?: number; talk?: boolean}> = ({d, x, y, s, f, seed, turn = 0.55, talk}) => {
  let p = pose({bodyTurn: turn, headTurn: turn + fbm(f / 120, seed) * 0.25, ...typingArms(f, rand(seed) > 0.4, seed)});
  p = alive(p, f, {seed});
  if (talk) {
    const v = Math.floor(f / 4 + seed) % 5;
    p.mouth = (['C', 'B', 'D', 'X', 'E'] as const)[v];
    p.smile = 0.3;
  }
  return <Character design={d} pose={p} light={LIGHT_DAY} x={x} y={y} scale={s} idp={`st${seed}`} legs={false} />;
};

export const S2College: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const shot = t < 4.5 ? 0 : t < 8 ? 1 : t < 11.5 ? 2 : 3;
  const intro = 1 - ramp(t, 0, 0.45, ease.out);
  return (
    <AbsoluteFill style={{background: '#000', filter: intro > 0.01 ? `blur(${intro * 16}px)` : undefined}}>
      {shot === 0 && <WideShot f={f} t={t} />}
      {shot === 1 && <HandsShot f={f} t={t} />}
      {shot === 2 && <ScreenShot f={f} t={t} />}
      {shot === 3 && <FaceShot f={f} t={t} />}
      <Grade shadow="#4a2f1e" highlight="#ffd59a" shadowOp={0.18} highlightOp={0.1} />
      <Vignette strength={0.42} color="30,18,8" />
      <Flash amount={0.6 * intro} color="#f6e7cf" />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};

const WideShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = ease.cam(clamp(t / 4.5));
  const cam = {x: -40 + 90 * k, y: 60, zoom: 1.06 + 0.06 * k, rot: 0, shake: 0};
  const on = isTyping(t);
  let g = pose({bodyTurn: 0.6, headTurn: 0.62, eyeX: 0.3, eyeY: 0.2, ...typingArms(f, on, 9)});
  g = withExpr(g, 'interest', 0.6);
  g = alive(g, f, {seed: 11, saccadeAmp: 0.08});
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.6}>
        <ClassroomWall />
      </Layer>
      <Layer depth={0.75}>
        <LightRays origin={[-80, 260]} angle={38} count={6} length={2000} spread={22} opacity={0.32} />
        <Svg>
          <Student d={STUDENTS[0]} x={230} y={1210} s={0.55} f={f} seed={21} />
          <Student d={STUDENTS[1]} x={560} y={1215} s={0.55} f={f} seed={22} turn={0.45} />
          <Student d={STUDENTS[3]} x={880} y={1210} s={0.55} f={f} seed={23} turn={0.3} />
          {[300, 630, 950].map((x, i) => (
            <g key={x}>
              <Monitor x={x + 70} y={1010} w={150} glow="#a8d4f5" screen={<CodeScreenLines x={x + 2} y={1016} w={136} h={80} t={t + i} seed={i + 2} />} />
              <Desk x={x - 30} y={1110} w={330} d={40} />
            </g>
          ))}
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Student d={CLASSMATE} x={170} y={1820} s={1.02} f={f} seed={31} turn={0.25} talk={t > 2.6 && t < 3.6} />
          <Character design={GLEB_CIVIL} pose={g} light={LIGHT_DAY} x={600} y={1850} scale={1.05} idp="g2w" legs={false} />
          {[390, 860].map((x, i) => (
            <Monitor key={x} x={x} y={1390} w={210} glow="#a8d4f5" screen={<CodeScreenLines x={x - 96} y={1398} w={192} h={114} t={t + i * 0.7} seed={i + 7} />} />
          ))}
          <Desk x={540} y={1560} w={1200} d={60} />
          <rect x={-100} y={1700} width={1300} height={300} fill="#6f5236" />
        </Svg>
      </Layer>
      <Layer depth={1.25}>
        <Dust count={40} color="#fff2d0" opacity={0.55} size={2.4} seed={4} area={[0, 200, 900, 1300]} speed={0.6} />
      </Layer>
    </CameraRig>
  );
};

const HandsShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 4.5;
  const cam = {x: 0, y: 0, zoom: 1.0 + 0.05 * clamp(lt / 3.5), rot: -2, shake: 0};
  const on = isTyping(t);
  const pressed: number[] = [];
  if (on) for (let i = 0; i < 3; i++) pressed.push(Math.floor(rand(Math.floor(f / 2) * 3 + i) * 70));
  const handBob = (s: number) => (on ? Math.abs(Math.sin(f * 1.6 + s)) * 14 : 0);
  const skin = GLEB_CIVIL.skin;
  const arm = (x: number, y: number, rot: number, side: number) => (
    <g transform={`translate(${x} ${y + handBob(side * 3)}) rotate(${rot})`}>
      {/* forearm in perspective from the bottom: wide near camera */}
      <path d="M-150 900 L150 900 L70 40 L-70 40Z" fill="#202329" />
      <path d={`M${-side * 90} 900 L${-side * 40} 60`} stroke="#33373f" strokeWidth={14} />
      <path d="M-60 120 q60 30 120 0" stroke="#15171b" strokeWidth={6} fill="none" />
      <rect x={-74} y={10} width={148} height={46} rx={20} fill="#a3a7ad" />
      <rect x={-74} y={44} width={148} height={10} fill="#7b8087" />
      <g transform="translate(0 20) rotate(180) scale(3.9)">
        <Hand pose="type" skin={skin} shade={GLEB_CIVIL.skinShade} dir={side} scale={1} />
      </g>
    </g>
  );
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.7}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg,#3a2c22 0%,#6b4b32 18%,#a77a50 60%,#8a6240 100%)'}} />
        <Svg>
          {Array.from({length: 18}).map((_, i) => (
            <path key={i} d={`M-100 ${300 + i * 100} Q540 ${280 + i * 100 + noise(i, 2) * 30} 1200 ${310 + i * 100}`} stroke="#5d4029" strokeWidth={3} opacity={0.25} fill="none" />
          ))}
          {/* monitor bottom edge with screen glow */}
          <rect x={60} y={-40} width={960} height={250} rx={18} fill="#16181c" />
          <rect x={90} y={-40} width={900} height={220} fill="#9ccbf0" />
          <CodeScreenLines x={90} y={-40} w={900} h={220} t={t} seed={4} />
          <ellipse cx={540} cy={330} rx={700} ry={260} fill="#bfe3ff" opacity={0.16} />
          <g transform="translate(940 760)">
            <ellipse cx={0} cy={80} rx={95} ry={30} fill="#000" opacity={0.25} />
            <rect x={-80} y={-80} width={160} height={160} rx={20} fill="#e8e2d5" />
            <ellipse cx={0} cy={-80} rx={80} ry={24} fill="#4a2f1f" />
            <path d="M80 -40 q60 10 0 80" stroke="#e8e2d5" strokeWidth={18} fill="none" />
          </g>
          <g transform="translate(120 560) rotate(-8)">
            <rect x={-130} y={-180} width={260} height={360} rx={8} fill="#2f5f86" />
            <rect x={-110} y={-160} width={220} height={320} fill="#f0ebdf" />
            {Array.from({length: 9}).map((_, i) => (
              <path key={i} d={`M-90 ${-130 + i * 32} h${120 + rand(i) * 50}`} stroke="#8b8478" strokeWidth={6} />
            ))}
          </g>
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <g transform="translate(540 560) scale(2.7)">
            <Keyboard x={0} y={0} w={380} pressed={pressed} />
          </g>
          {arm(330, 900, 10, -1)}
          {arm(760, 910, -9, 1)}
        </Svg>
      </Layer>
    </CameraRig>
  );
};

const CODE = [
  ['// Проект: система управления', '#7f8c98'],
  ['import { Sensor, Motor } from "./robot";', '#c678dd'],
  ['', ''],
  ['class Controller {', '#e5c07b'],
  ['  speed = 0;', '#abb2bf'],
  ['  update(dt: number) {', '#61afef'],
  ['    const d = this.sensor.read();', '#abb2bf'],
  ['    if (d < 30) this.motor.stop();', '#98c379'],
  ['    else this.motor.run(this.speed);', '#98c379'],
  ['  }', '#abb2bf'],
  ['}', '#e5c07b'],
];

const ScreenShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 8;
  const cam = {x: -20 * lt, y: 10 * lt, zoom: 1.02 + 0.04 * lt / 3.5, rot: 0, shake: 0};
  const chars = Math.floor(clamp((lt - 0.2) / 3.0) * CODE.reduce((a, c) => a + c[0].length, 0));
  let left = chars;
  const cursorOn = Math.floor(f / 8) % 2 === 0;
  return (
    <CameraRig cam={cam}>
      <Layer depth={1}>
        <AbsoluteFill style={{background: '#14171c'}} />
        <Svg>
          <rect x={30} y={250} width={1020} height={1420} rx={26} fill="#0e1014" />
          <rect x={60} y={280} width={960} height={1360} fill="#1e2228" />
          <rect x={60} y={280} width={960} height={70} fill="#2a2f37" />
          {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, i) => (
            <circle key={c} cx={100 + i * 40} cy={315} r={12} fill={c} />
          ))}
          <text x={240} y={326} fontFamily="Montserrat" fontWeight={700} fontSize={28} fill="#9aa4b2">
            controller.ts — Курсовой проект
          </text>
          {CODE.map(([line, col], i) => {
            const n = Math.max(0, Math.min(line.length, left));
            left -= line.length;
            const shown = line.slice(0, n);
            const cur = n < line.length && n > 0;
            return (
              <g key={i}>
                <text x={90} y={420 + i * 56} fontFamily="DejaVu Sans Mono" fontSize={26} fill="#4b5363">
                  {i + 1}
                </text>
                <text x={150} y={420 + i * 56} fontFamily="DejaVu Sans Mono" fontSize={31} fill={col} style={{whiteSpace: 'pre'}}>
                  {shown}
                  {cur && cursorOn ? '▍' : ''}
                </text>
              </g>
            );
          })}
          {/* schematic panel */}
          <rect x={90} y={1060} width={900} height={540} rx={12} fill="#161a20" stroke="#2f3846" strokeWidth={3} />
          <text x={120} y={1110} fontFamily="Montserrat" fontWeight={700} fontSize={28} fill="#7fb7ff">
            Модель: колёсная платформа
          </text>
          <g transform={`translate(540 1360) rotate(${lt * 8})`} stroke="#7fd1c7" strokeWidth={3} fill="none" opacity={0.85}>
            <rect x={-200} y={-90} width={400} height={180} rx={20} />
            <rect x={-140} y={-150} width={180} height={60} rx={10} />
            {[-150, 150].map((x) => (
              <g key={x}>
                <circle cx={x} cy={110} r={56} />
                <circle cx={x} cy={110} r={18} />
              </g>
            ))}
            <path d="M-200 0 H200 M0 -90 V90" strokeDasharray="10 10" opacity={0.5} />
          </g>
        </Svg>
      </Layer>
      <Layer depth={1.2}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08), transparent 60%)'}} />
      </Layer>
    </CameraRig>
  );
};

const FaceShot: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 11.5;
  const cam = {x: 0, y: 0, zoom: 1 + 0.06 * ease.cam(clamp(lt / 5.5)), rot: 0, shake: 0};
  const lf = Math.round(lt * 30);
  const look = ramp(lt, 1.3, 1.75, ease.out) * (1 - ramp(lt, 3.6, 4.1));
  const e = exprTrack(lf, [
    [0, 'interest'],
    [Math.round(1.6 * 30), 'joy', 8],
    [Math.round(3.8 * 30), 'interest', 14],
  ]);
  const nod = lt > 2.2 && lt < 3.0 ? Math.sin((lt - 2.2) * Math.PI * 2.5) * 0.35 : 0;
  let g = pose({bodyTurn: 0.5, headTurn: 0.55 - look * 1.0, eyeX: 0.35 - look * 0.9, eyeY: 0.15, headNod: nod, armL: {shoulder: 4, elbow: 10, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 4, elbow: 10, wrist: 0, hand: 'relaxed'}});
  g = withExpr(g, e);
  if (lt > 1.8 && lt < 2.6) g.mouth = Math.floor(f / 4) % 2 ? 'C' : 'D';
  g = alive(g, f, {seed: 12});
  // Artyom leans in
  const lean = ramp(lt, 0.2, 1.0, ease.back) * (1 - ramp(lt, 3.8, 4.6));
  let a = pose({bodyTurn: 0.45, headTurn: 0.55, lean: -8 * lean, eyeX: 0.4});
  a = withExpr(a, 'joy', 0.7);
  if (lt > 0.9 && lt < 1.7) a.mouth = (['C', 'B', 'D', 'E'] as const)[Math.floor(f / 3) % 4];
  a = alive(a, f, {seed: 13});
  const screenFlicker = 0.85 + 0.15 * noise(f / 6, 2);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5} blur={9}>
        <ClassroomWall />
      </Layer>
      <Layer depth={0.8} blur={4}>
        <Svg>
          <Character design={CLASSMATE} pose={a} light={LIGHT_DAY} x={160 + lean * 60} y={1780} scale={1.25} idp="art" legs={false} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_CIVIL} pose={g} light={LIGHT_SCREEN} x={580} y={1960} scale={2.6} idp="g2f" legs={false} />
        </Svg>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 50% 40% at 100% 45%, rgba(150,200,255,${0.28 * screenFlicker}), transparent 70%)`, mixBlendMode: 'screen'}} />
      </Layer>
      <Layer depth={1.4} blur={12}>
        <Svg>
          <Monitor x={1080} y={1200} w={520} back />
        </Svg>
      </Layer>
      <Dust count={24} color="#fff2d0" opacity={0.45} size={2} seed={9} speed={0.5} />
    </CameraRig>
  );
};
void kf;
void VISEME_PARAMS;
