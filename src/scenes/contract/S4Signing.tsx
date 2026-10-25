// Scene 4 — signing: Gleb at the table → document close-up (fine print
// foreshadowing) → the pen draws the signature → his face as light dims.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer, Svg} from '../../camera/Camera';
import {OfficeRoom, Paper} from './backgrounds/Interior';
import {Black, Dust, Grade, Grain, Vignette} from '../../effects/Atmosphere';
import {Character} from '../../characters/Character';
import {Hand} from '../../characters/Body';
import {GLEB_CIVIL, REPRESENTATIVE} from '../../characters/designs';
import {Light} from '../../characters/types';
import {alive, exprTrack, pose, withExpr} from '../../animation/performance';
import {clamp, ease, kf, ramp} from '../../animation/core';
import {ev} from '../../data';

const S = 's4_signing';
export const LIGHT_LAMP: Light = {x: -0.7, y: -0.5, rim: '#ffd9a0', rimStrength: 0.55, shade: '#4b3a44', shadeStrength: 0.45};

// signature curve (cursive "Глеб ..."), normalised u∈[0,1]
const SIG = Array.from({length: 240}).map((_, i) => {
  const u = i / 239;
  const x = 300 * u + 26 * Math.sin(u * 40) * (u < 0.85 ? 1 : 0.3);
  const y = 30 * Math.sin(u * 23) * Math.exp(-u * 0.8) - 22 * Math.cos(u * 40) * (u < 0.85 ? 1 : 0.2) + (u > 0.85 ? -60 * (u - 0.85) : 0);
  return [x, y] as [number, number];
});

export const S4Signing: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const shot = t < 4.5 ? 0 : t < 8.3 ? 1 : t < 10.8 ? 2 : 3;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shot === 0 && <AtTable f={f} t={t} />}
      {shot === 1 && <Document t={t} />}
      {shot === 2 && <Pen f={f} t={t} />}
      {shot === 3 && <Face f={f} t={t} />}
      <Grade shadow="#2e2333" highlight="#ffcf8a" shadowOp={0.28} highlightOp={0.07} />
      <Vignette strength={0.6} />
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};

const AtTable: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = ease.cam(clamp(t / 4.5));
  const cam = {x: 30 * k, y: 0, zoom: 1.03 + 0.06 * k, rot: 0, shake: 0};
  const slide = ev(S, 'paperSlide');
  const px = kf(t, [[slide, 1250], [slide + 0.8, 700, ease.out]]);
  const lf = f;
  const e = exprTrack(lf, [
    [0, 'interest'],
    [Math.round((slide + 0.9) * 30), 'doubt', 18],
  ]);
  let g = pose({bodyTurn: 0.25, headTurn: 0.2, headNod: 0.45, eyeY: 0.75, eyeX: 0.2, armL: {shoulder: 8, elbow: 92, wrist: 0, hand: 'relaxed'}, armR: {shoulder: 4, elbow: 98, wrist: 0, hand: 'relaxed'}});
  g = withExpr(g, e);
  g = alive(g, f, {seed: 21, saccadeAmp: 0.06});
  const repHand = kf(t, [[slide, 1250], [slide + 0.8, 860, ease.out], [slide + 1.6, 860], [slide + 2.3, 1300, ease.in]]);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.6}>
        <OfficeRoom poster lamp={1} window={false} />
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_CIVIL} pose={g} light={LIGHT_LAMP} x={520} y={1640} scale={2.05} idp="g4a" legs={false} />
          {/* table */}
          <path d="M-100 1380 L1180 1380 L1180 1460 L-100 1460Z" fill="#6b4a33" />
          <path d="M-100 1460 L1180 1460 L1180 2000 L-100 2000Z" fill="#4a3324" />
          <rect x={-100} y={1372} width={1300} height={12} fill="#8a6446" />
          <g transform="translate(0 0)">
            <ellipse cx={px - 40} cy={1430} rx={240} ry={26} fill="#000" opacity={0.2} />
            <g transform={`translate(${px} 1420) scale(1 0.32)`}>
              <Paper x={0} y={0} w={420} title="КОНТРАКТ" />
            </g>
          </g>
          {/* recruiter's arm entering from the right */}
          <g transform={`translate(${repHand + 80} 1440) rotate(-95)`}>
            <path d="M-38 0 L38 0 L46 -300 L-46 -300Z" fill={REPRESENTATIVE.colors.top} />
            <rect x={-40} y={-14} width={80} height={20} fill={REPRESENTATIVE.colors.topShade} />
            <g transform="scale(2.4)">
              <Hand pose="open" skin={REPRESENTATIVE.skin} shade={REPRESENTATIVE.skinShade} dir={1} />
            </g>
          </g>
          {/* pen on the table */}
          <g transform="translate(300 1420) rotate(-12)">
            <rect x={-110} y={-6} width={220} height={12} rx={6} fill="#1d2a44" />
            <rect x={90} y={-7} width={30} height={14} rx={3} fill="#c9a54a" />
          </g>
        </Svg>
      </Layer>
      <Dust count={26} color="#ffe2b0" opacity={0.45} size={2} seed={6} speed={0.4} area={[0, 300, 800, 1000]} />
    </CameraRig>
  );
};

const DOC_LINES: [string, number, string?][] = [
  ['КОНТРАКТ', 54, 'title'],
  ['о прохождении военной службы', 34, 'sub'],
  ['1. Гражданин обязуется проходить военную службу', 25],
  ['   в течение срока, установленного контрактом.', 25],
  ['2. Направление подготовки: беспилотные системы*', 25, 'hl'],
  ['3. Место прохождения службы определяется', 25],
  ['   в установленном порядке.', 25],
  ['4. Срок контракта: 1 (один) год.', 25],
  ['', 25],
  ['* окончательное распределение — по решению командования', 17, 'fine'],
];

const Document: React.FC<{t: number}> = ({t}) => {
  const lt = t - 4.5;
  const pan = ease.cam(clamp(lt / 3.6));
  const cam = {x: 0, y: -260 + 640 * pan, zoom: 1.12 + 0.1 * pan, rot: -3, shake: 0};
  const turn = ev(S, 'paperTurn') - 4.5;
  const slideIn = kf(lt, [[turn - 0.3, 0], [turn + 0.3, 1, ease.out]]);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.9}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 40% 30%, #7a5638, #3b281b 80%)'}} />
      </Layer>
      <Layer depth={1}>
        <Svg>
          <g transform={`translate(${-40 + slideIn * 40} 0)`}>
            <rect x={70} y={110} width={950} height={1500} fill="#000" opacity={0.3} transform="translate(14 18)" />
            <rect x={70} y={110} width={950} height={1500} fill="#f6f2e8" />
            {DOC_LINES.map(([txt, size, kind], i) => (
              <text
                key={i}
                x={kind === 'title' || kind === 'sub' ? 545 : 130}
                y={240 + i * 82 + (kind === 'fine' ? 330 : 0)}
                textAnchor={kind === 'title' || kind === 'sub' ? 'middle' : 'start'}
                fontFamily={kind === 'title' ? 'Oswald' : 'Montserrat'}
                fontWeight={kind === 'title' ? 700 : kind === 'hl' ? 700 : 500}
                fontSize={size}
                fill={kind === 'fine' ? '#6f6a60' : '#2a2a2a'}
                style={{whiteSpace: 'pre'}}
              >
                {txt}
              </text>
            ))}
            {Array.from({length: 4}).map((_, i) => (
              <rect key={i} x={130} y={1000 + i * 40} width={700 + (i % 2) * 90} height={9} fill="#9a958a" opacity={0.6} />
            ))}
            <text x={130} y={1420} fontFamily="Montserrat" fontWeight={500} fontSize={26} fill="#2a2a2a">
              Подпись:
            </text>
            <path d="M270 1430 H760" stroke="#333" strokeWidth={2.5} />
          </g>
        </Svg>
      </Layer>
      <Layer depth={1.3}>
        <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(255,210,150,0.12), transparent 50%)', mixBlendMode: 'screen'}} />
      </Layer>
    </CameraRig>
  );
};

const Pen: React.FC<{f: number; t: number}> = ({t}) => {
  const p0 = ev(S, 'penStart');
  const p1 = ev(S, 'penEnd');
  const u = clamp((t - p0) / (p1 - p0));
  const n = Math.max(1, Math.floor(u * (SIG.length - 1)));
  const pts = SIG.slice(0, n + 1);
  const tip = pts[pts.length - 1];
  const lt = t - 8.3;
  const cam = {x: tip[0] * 0.6 - 60, y: tip[1] * 0.3, zoom: 1.0 + 0.04 * lt, rot: 0, shake: 0};
  const ox = 330;
  const oy = 980;
  const lift = t < p0 ? kf(t, [[8.3, 60], [p0, 0, ease.out]]) : t > p1 ? kf(t, [[p1, 0], [p1 + 0.4, 80, ease.out]]) : 0;
  return (
    <CameraRig cam={cam}>
      <Layer depth={1}>
        <AbsoluteFill style={{background: '#f3eee2'}} />
        <Svg>
          {Array.from({length: 6}).map((_, i) => (
            <rect key={i} x={60} y={420 + i * 70} width={820 + (i % 3) * 60} height={14} fill="#a39d90" opacity={0.5} />
          ))}
          <text x={60} y={995} fontFamily="Montserrat" fontWeight={500} fontSize={40} fill="#2a2a2a">
            Подпись:
          </text>
          <path d="M290 1010 H1100" stroke="#333" strokeWidth={3} />
          <g transform={`translate(${ox} ${oy}) scale(1.9)`}>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#1d2f6b" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* hand + pen */}
          <g transform={`translate(${ox + tip[0] * 1.9} ${oy + tip[1] * 1.9 - lift})`}>
            <path d="M150 -330 L700 -760 L900 -520 L300 -160Z" fill="#202329" />
            <path d="M210 -250 L330 -150" stroke="#a3a7ad" strokeWidth={46} strokeLinecap="round" />
            <g transform="rotate(38)">
              <rect x={-10} y={-430} width={20} height={410} rx={10} fill="#1d2a44" />
              <path d="M-10 -20 L10 -20 L0 8Z" fill="#c9a54a" />
              <rect x={-11} y={-360} width={22} height={70} rx={4} fill="#c9a54a" />
            </g>
            <g transform="translate(120 -150) rotate(-140) scale(4.4)">
              <Hand pose="hold" skin={GLEB_CIVIL.skin} shade={GLEB_CIVIL.skinShade} dir={-1} />
            </g>
          </g>
        </Svg>
      </Layer>
      <Layer depth={1.2}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 20% 10%, rgba(255,200,130,0.25), transparent 60%)', mixBlendMode: 'multiply'}} />
      </Layer>
    </CameraRig>
  );
};

const Face: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 10.8;
  const cam = {x: 0, y: -30 * lt, zoom: 1 + 0.12 * ease.cam(clamp(lt / 4.2)), rot: 0, shake: 0};
  const lf = Math.round(lt * 30);
  const e = exprTrack(lf, [
    [0, 'neutral'],
    [8, 'joy', 14],
    [Math.round(1.8 * 30), 'doubt', 30],
    [Math.round(3.0 * 30), 'anxiety', 40],
  ]);
  let g = pose({bodyTurn: 0.3, headTurn: 0.28, eyeY: 0.1, headNod: 0.05});
  g = withExpr(g, e);
  g.smile = Math.min(g.smile, 0.35);
  g = alive(g, f, {seed: 22, saccadeAmp: 0.05});
  const dim = ramp(lt, 2.2, 4.2, ease.inOut);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5} blur={10}>
        <OfficeRoom poster lamp={1 - dim * 0.7} window={false} id="of2" />
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={GLEB_CIVIL} pose={g} light={LIGHT_LAMP} x={540} y={2150} scale={3.2} idp="g4f" legs={false} />
        </Svg>
      </Layer>
      <Black amount={dim * 0.45} />
      <Dust count={20} color="#ffe2b0" opacity={0.35 * (1 - dim)} size={2} seed={7} speed={0.4} />
    </CameraRig>
  );
};
