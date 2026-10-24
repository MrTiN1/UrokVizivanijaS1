// Scene 7 — departure: inside an army truck at dusk, forest scrolling past
// the rear opening; Gleb looks at his hands; push-in to the eyes; fade out.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer, Svg} from '../camera/Camera';
import {FarTreeline, TreeLayer, WarSky, treeRow} from './backgrounds/War';
import {Black, Dust, Flash, Grade, Grain, Vignette} from '../effects/Atmosphere';
import {Character} from '../characters/Character';
import {Hand} from '../characters/Body';
import {GLEB_MILITARY, SOLDIERS} from '../characters/designs';
import {Light} from '../characters/types';
import {alive, exprTrack, pose, withExpr} from '../animation/performance';
import {clamp, ease, fbm, noise, ramp} from '../animation/core';
import {evArr} from '../data';

const S = 's7_transport';
const LIGHT_DUSK: Light = {x: 0.8, y: 0, rim: '#ff9a4c', rimStrength: 0.7, shade: '#141a26', shadeStrength: 0.65};

const vib = (f: number, amp = 1) => ({x: fbm(f / 1.7, 3) * 3 * amp, y: (fbm(f / 1.3, 5) * 4 + Math.max(0, noise(f / 9, 2)) * 5) * amp});

/** Moving dusk forest seen through an opening, clipped to a rectangle. */
const Outside: React.FC<{f: number; x: number; y: number; w: number; h: number; id: string}> = ({f, x, y, w, h, id}) => {
  const near = treeRow(12, 1260, 380, 720, 8, 18, 4);
  const far = treeRow(18, 1200, 160, 300, 4, 8, 9);
  const s1 = (f * 14) % 1300;
  const s2 = (f * 5) % 1300;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -x, top: -y, width: 1080, height: 1920}}>
        <WarSky horizon={1180} id={id} glow={1.1} />
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${s2}px)`}}>
          <svg width={2400} height={1920} style={{position: 'absolute', left: -1300}}>
            <FarTreeline y={1200} color="#1f1d22" seed={3} />
            <g transform="translate(1300 0)">
              <FarTreeline y={1200} color="#1f1d22" seed={3} />
            </g>
          </svg>
          <div style={{position: 'absolute', inset: 0, left: -1300}}>
            <TreeLayer trees={far} color="#18171b" rim="#b2602f" />
          </div>
          <TreeLayer trees={far} color="#18171b" rim="#b2602f" />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${s1}px)`}}>
          <div style={{position: 'absolute', inset: 0, left: -1300}}>
            <TreeLayer trees={near} color="#0c0c0e" rim="#d2763c" />
          </div>
          <TreeLayer trees={near} color="#0c0c0e" rim="#d2763c" />
        </div>
      </div>
    </div>
  );
};

const TruckInterior: React.FC<{f: number}> = ({f}) => (
  <Svg>
    <defs>
      <radialGradient id="tr-glow" cx="0.5" cy="0.55" r="0.6">
        <stop offset="0" stopColor="#ff8c44" stopOpacity={0.35} />
        <stop offset="1" stopColor="#ff8c44" stopOpacity={0} />
      </radialGradient>
    </defs>
    {/* canvas cover with ribs, rear opening in the middle */}
    <path d="M-200 -100 L1280 -100 L1280 2100 L-200 2100Z M300 560 Q540 470 780 560 L780 1240 L300 1240Z" fill="#2a2c22" fillRule="evenodd" />
    {[-80, 120, 960, 1160].map((x, i) => (
      <path key={i} d={`M${x} -100 Q${x + (x < 540 ? 60 : -60)} 700 ${x} 1500`} stroke="#1a1b15" strokeWidth={26} fill="none" />
    ))}
    <path d="M300 560 Q540 470 780 560" stroke="#15160f" strokeWidth={22} fill="none" />
    <rect x={300} y={1230} width={480} height={30} fill="#1a1a15" />
    <ellipse cx={540} cy={900} rx={520} ry={600} fill="url(#tr-glow)" />
    {/* benches */}
    <path d="M-200 1500 L330 1330 L330 1370 L-200 1560Z" fill="#3a2e22" />
    <path d="M1280 1500 L750 1330 L750 1370 L1280 1560Z" fill="#3a2e22" />
    <path d="M-200 1560 L330 1370 L330 2100 L-200 2100Z" fill="#17130f" />
    <path d="M1280 1560 L750 1370 L750 2100 L1280 2100Z" fill="#17130f" />
    <path d="M330 1260 L750 1260 L1080 2100 L0 2100Z" fill="#1f1b15" />
    {Array.from({length: 6}).map((_, i) => (
      <path key={i} d={`M${330 - i * 60} ${1260 + i * 140} L${750 + i * 60} ${1260 + i * 140}`} stroke="#2b251d" strokeWidth={4} opacity={0.6} />
    ))}
    <circle cx={540 + noise(f / 30, 1) * 2} cy={300} r={0} />
  </Svg>
);

export const S7Transport: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const shot = t < 5 ? 0 : t < 8.6 ? 1 : 2;
  const booms = evArr(S, 'boom');
  const flash = booms.reduce((a, b) => Math.max(a, Math.max(0, 1 - Math.abs(t - b - 0.1) / 0.35)), 0);
  const [fo0, fo1] = evArr(S, 'fadeOut');
  const fade = ramp(t, fo0, fo1, ease.inOut);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shot === 0 && <Wide f={f} t={t} />}
      {shot === 1 && <Hands f={f} t={t} />}
      {shot === 2 && <Eyes f={f} t={t} />}
      <Flash amount={flash * 0.12} color="#ff9a50" />
      <Grade shadow="#1a2232" highlight="#ff9a50" shadowOp={0.38} highlightOp={0.06} />
      <Vignette strength={0.8} />
      <Black amount={fade} />
      <Grain opacity={0.11} />
    </AbsoluteFill>
  );
};

const seated = (seed: number, f: number, turn: number) => {
  let p = pose({
    bodyTurn: turn,
    headTurn: turn + fbm(f / 140, seed) * 0.3,
    headNod: 0.25,
    eyeY: 0.4,
    helmet: true,
    dirt: 0.4,
    legL: {hip: 80, knee: 85, foot: 0},
    legR: {hip: 76, knee: 80, foot: 0},
    armL: {shoulder: 16, elbow: 40, wrist: 0, hand: 'relaxed'},
    armR: {shoulder: 20, elbow: 36, wrist: 0, hand: 'relaxed'},
  });
  p = withExpr(p, 'tired', 0.8);
  return alive(p, f, {seed});
};

const Wide: React.FC<{f: number; t: number}> = ({f, t}) => {
  const v = vib(f);
  const k = ease.cam(clamp(t / 5));
  const cam = {x: v.x, y: v.y, zoom: 1.02 + 0.06 * k, rot: fbm(f / 20, 4) * 0.4, shake: 0};
  let g = seated(91, f, 0.55);
  g = withExpr(g, 'anxiety', 0.6);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.3}>
        <Outside f={f} x={300} y={470} w={480} h={790} id="o1" />
      </Layer>
      <Layer depth={1}>
        <TruckInterior f={f} />
        <Svg>
          <Character design={SOLDIERS[1]} pose={seated(92, f + 7, -0.55)} light={LIGHT_DUSK} x={860 + v.x} y={1430} scale={0.62} idp="sl1" />
          <Character design={SOLDIERS[0]} pose={seated(93, f + 13, 0.55)} light={LIGHT_DUSK} x={210 + v.x} y={1460} scale={0.66} idp="sl0" />
          <Character design={SOLDIERS[2]} pose={seated(94, f + 21, -0.55)} light={LIGHT_DUSK} x={1080} y={1580} scale={0.8} idp="sl2" />
          <Character design={GLEB_MILITARY} pose={g} light={LIGHT_DUSK} x={300 + v.x * 1.4} y={1560 + v.y * 0.5} scale={1.15} idp="g7w" />
        </Svg>
      </Layer>
      <Dust count={30} color="#ffb27a" opacity={0.35} size={2} seed={13} speed={1.2} area={[200, 400, 700, 1200]} />
    </CameraRig>
  );
};

const Hands: React.FC<{f: number; t: number}> = ({f, t}) => {
  const v = vib(f, 0.8);
  const lt = t - 5;
  const cam = {x: v.x, y: v.y, zoom: 1.0 + 0.05 * lt, rot: 0, shake: 0};
  const tremble = Math.sin(f * 1.9) * 1.6 + fbm(f / 2, 7) * 1.4;
  const rub = Math.sin(lt * 2.2) * 14 * ramp(lt, 1.2, 1.8);
  const C = GLEB_MILITARY;
  return (
    <CameraRig cam={cam}>
      <Layer depth={1}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 70% 20%, #3a2a20, #0b0b0c 70%)'}} />
        <Svg>
          {/* knees / trousers */}
          <path d="M-100 1100 Q300 980 560 1060 Q800 980 1180 1100 L1180 2000 L-100 2000Z" fill={C.colors.pants} />
          <path d="M540 1060 Q560 1500 520 2000" stroke={C.colors.pantsShade} strokeWidth={20} fill="none" />
          <path d="M-100 1300 Q200 1240 420 1300 M700 1300 Q900 1240 1180 1300" stroke={C.colors.pantsShade} strokeWidth={10} fill="none" opacity={0.6} />
          {/* sleeves */}
          <path d="M-120 600 L280 820 L240 1000 L-160 840Z" fill={C.colors.top} />
          <path d="M1200 600 L800 820 L840 1000 L1240 840Z" fill={C.colors.top} />
          <g transform={`translate(${300 + rub} ${930 + tremble}) rotate(-62) scale(5.2)`}>
            <Hand pose="relaxed" skin={C.skin} shade={C.skinShade} dir={1} />
          </g>
          <g transform={`translate(${780 - rub * 0.6} ${940 - tremble}) rotate(64) scale(5.2)`}>
            <Hand pose="fist" skin={C.skin} shade={C.skinShade} dir={-1} />
          </g>
          {/* scratches & dirt on skin */}
          <path d="M360 1010 l40 18" stroke="#7a3a30" strokeWidth={3} opacity={0.6} />
        </Svg>
        <AbsoluteFill style={{background: 'linear-gradient(110deg, transparent 40%, rgba(255,150,80,0.25) 75%)', mixBlendMode: 'screen'}} />
      </Layer>
    </CameraRig>
  );
};

const Eyes: React.FC<{f: number; t: number}> = ({f, t}) => {
  const v = vib(f, 0.6);
  const lt = t - 8.6;
  const push = ease.cam(clamp(lt / 4.6));
  const cam = {x: v.x - 10 * push, y: v.y - 110 * push, zoom: 1.0 + 0.9 * push, rot: 0, shake: 0};
  const lf = Math.round(lt * 30);
  const e = exprTrack(lf, [
    [0, 'anxiety'],
    [60, 'fear', 50],
  ]);
  let g = pose({bodyTurn: 0.35, headTurn: 0.3, eyeX: 0.35, eyeY: 0.05, helmet: true, dirt: 0.8});
  g = withExpr(g, e);
  g = alive(g, f, {seed: 95, saccadeAmp: 0.04, headMotion: 0.3, breatheRate: 1.5});
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.4} blur={10}>
        <Outside f={f} x={0} y={0} w={1080} h={1920} id="o2" />
        <AbsoluteFill style={{background: 'rgba(10,12,16,0.35)'}} />
      </Layer>
      <Layer depth={1} origin={[560, 720]} style={{filter: 'brightness(0.8) saturate(0.85)'}}>
        <Svg>
          <Character design={GLEB_MILITARY} pose={g} light={LIGHT_DUSK} x={540} y={2350} scale={3.9} idp="g7e" legs={false} />
        </Svg>
      </Layer>
    </CameraRig>
  );
};
