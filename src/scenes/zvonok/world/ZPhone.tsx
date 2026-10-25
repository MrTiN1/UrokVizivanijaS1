// Artyom's phone: a device frame held in a hand (same construction as the
// bus series' phone) with screens for this story: incoming call from his
// own number, in-call, dialling, the "can't call your own number" error,
// the call log and the home-camera app with two recordings.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Character} from '../../../characters/Character';
import {ARTEM} from '../../../characters/designs';
import {Light, Pose, basePose} from '../../../characters/types';
import {walk} from '../../../animation/cycles';
import {rand} from '../../../animation/core';

export const SW = 400;
export const SH = 860;
export const MY_NUMBER = '+7 912 347-20-13';

const Status: React.FC<{time: string}> = ({time}) => (
  <g>
    <text x={28} y={40} fontFamily="Montserrat" fontWeight={700} fontSize={22} fill="#fff">
      {time}
    </text>
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={300 + i * 9} y={34 - i * 5} width={6} height={6 + i * 5} rx={1} fill="#fff" />
    ))}
    <rect x={346} y={24} width={34} height={17} rx={4} fill="none" stroke="#fff" strokeWidth={2} />
    <rect x={349} y={27} width={20} height={11} rx={2} fill="#7ee08a" />
  </g>
);

const Avatar: React.FC<{y: number; pulse: number}> = ({y, pulse}) => (
  <g>
    <circle cx={SW / 2} cy={y} r={92 + pulse * 26} fill="#7aa7ff" opacity={0.12 * (1 - pulse)} />
    <circle cx={SW / 2} cy={y} r={82} fill="#3a4b6e" />
    <text x={SW / 2} y={y + 26} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={72} fill="#e8eefb">
      А
    </text>
  </g>
);

/** Incoming call screen: name «АРТЁМ», own number, accept / decline buttons. */
export const IncomingScreen: React.FC<{time: string; t: number; accepted?: number}> = ({time, t, accepted = 0}) => {
  const pulse = (t * 1.2) % 1;
  return (
    <g>
      <rect width={SW} height={SH} fill="#0d1322" />
      <circle cx={SW / 2} cy={260} r={260} fill="#22305a" opacity={0.5} />
      <Status time={time} />
      <text x={SW / 2} y={110} textAnchor="middle" fontFamily="Montserrat" fontWeight={500} fontSize={20} fill="#9fb0d0">
        Входящий вызов · мобильный
      </text>
      <Avatar y={270} pulse={pulse} />
      <text x={SW / 2} y={420} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={46} fill="#fff">
        АРТЁМ
      </text>
      <text x={SW / 2} y={462} textAnchor="middle" fontFamily="Montserrat" fontWeight={600} fontSize={24} fill="#cdd6ea">
        {MY_NUMBER}
      </text>
      <rect x={70} y={490} width={260} height={38} rx={19} fill="#ffcf4a" opacity={0.16} />
      <text x={SW / 2} y={516} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={18} fill="#ffcf4a">
        это ваш номер
      </text>
      <g opacity={1 - accepted}>
        <circle cx={100} cy={720} r={44} fill="#e2453a" />
        <path d="M78 724 q22 -16 44 0" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={300} cy={720 - 8 * Math.abs(Math.sin(t * 6))} r={44} fill="#37c65b" />
        <path d={`M280 ${716 - 8 * Math.abs(Math.sin(t * 6))} q20 16 40 0`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      <rect x={SW / 2 - 60} y={SH - 26} width={120} height={6} rx={3} fill="#fff" opacity={0.6} />
    </g>
  );
};

/** In-call screen with timer (and an optional "silence" waveform). */
export const InCallScreen: React.FC<{time: string; seconds: number; silent?: boolean; speaker?: boolean}> = ({time, seconds, silent, speaker}) => {
  const f = useCurrentFrame();
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
  return (
    <g>
      <rect width={SW} height={SH} fill="#0d1322" />
      <Status time={time} />
      <Avatar y={230} pulse={0} />
      <text x={SW / 2} y={380} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={44} fill="#fff">
        АРТЁМ
      </text>
      <text x={SW / 2} y={420} textAnchor="middle" fontFamily="Montserrat" fontWeight={600} fontSize={26} fill="#9fd8a8">
        {mm}:{ss}
      </text>
      {/* voice waveform */}
      <g transform="translate(60 500)">
        {Array.from({length: 28}).map((_, i) => {
          const a = silent ? 0.06 : 0.3 + 0.7 * Math.abs(Math.sin(f / 3 + i * 0.7) * rand(i + Math.floor(f / 2)));
          return <rect key={i} x={i * 10} y={-a * 40} width={6} height={a * 80} rx={3} fill="#7aa7ff" opacity={0.8} />;
        })}
      </g>
      {[['динамик', 70, 640, speaker], ['без звука', 200, 640, false], ['клавиши', 330, 640, false]].map(([lbl, x, y, on], i) => (
        <g key={i}>
          <circle cx={x as number} cy={y as number} r={36} fill={on ? '#e8eefb' : '#24304a'} />
          <text x={x as number} y={(y as number) + 62} textAnchor="middle" fontFamily="Montserrat" fontSize={15} fill="#9fb0d0">
            {lbl as string}
          </text>
        </g>
      ))}
      <circle cx={SW / 2} cy={770} r={42} fill="#e2453a" />
      <rect x={SW / 2 - 60} y={SH - 26} width={120} height={6} rx={3} fill="#fff" opacity={0.6} />
    </g>
  );
};

/** Dialling his own number, then the error card. */
export const DialScreen: React.FC<{time: string; t: number; error: number}> = ({time, t, error}) => (
  <g>
    <rect width={SW} height={SH} fill="#0d1322" />
    <Status time={time} />
    <Avatar y={230} pulse={0} />
    <text x={SW / 2} y={380} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={44} fill="#fff">
      АРТЁМ
    </text>
    <text x={SW / 2} y={420} textAnchor="middle" fontFamily="Montserrat" fontWeight={600} fontSize={24} fill="#9fb0d0">
      Вызов{'.'.repeat(1 + (Math.floor(t * 3) % 3))}
    </text>
    <g opacity={error}>
      <rect x={30} y={470} width={SW - 60} height={170} rx={24} fill="#2a1416" stroke="#e2453a" strokeWidth={3} />
      <circle cx={80} cy={530} r={22} fill="#e2453a" />
      <text x={80} y={540} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={28} fill="#fff">
        !
      </text>
      <text x={116} y={526} fontFamily="Montserrat" fontWeight={700} fontSize={22} fill="#fff">
        Невозможно вызвать
      </text>
      <text x={116} y={556} fontFamily="Montserrat" fontWeight={700} fontSize={22} fill="#fff">
        собственный номер
      </text>
      <text x={56} y={606} fontFamily="Montserrat" fontWeight={500} fontSize={18} fill="#e7b5b0">
        {MY_NUMBER} — это вы
      </text>
    </g>
    <circle cx={SW / 2} cy={770} r={42} fill="#e2453a" />
  </g>
);

/** Call log: the last incoming call came from his own number (same as "Мой номер"). */
export const CallLogScreen: React.FC<{time: string; highlight: number}> = ({time, highlight}) => (
  <g>
    <rect width={SW} height={SH} fill="#0d1322" />
    <Status time={time} />
    <text x={28} y={100} fontFamily="Montserrat" fontWeight={800} fontSize={34} fill="#fff">
      Недавние
    </text>
    {[
      ['АРТЁМ', MY_NUMBER, '23:58', true],
      ['Мама', '+7 912 105-44-07', '19:12', false],
      ['Доставка', '+7 495 000-00-00', 'вчера', false],
    ].map(([n, num, tm, me], i) => (
      <g key={i} transform={`translate(0 ${150 + i * 110})`}>
        {me ? <rect x={14} y={-8} width={SW - 28} height={96} rx={16} fill="#ffcf4a" opacity={0.14 * highlight} /> : null}
        <circle cx={60} cy={40} r={30} fill="#3a4b6e" />
        <text x={110} y={34} fontFamily="Montserrat" fontWeight={700} fontSize={24} fill={me ? '#ffcf4a' : '#fff'}>
          {n as string}
        </text>
        <text x={110} y={64} fontFamily="Montserrat" fontWeight={500} fontSize={18} fill="#9fb0d0">
          {num as string}
        </text>
        <text x={SW - 30} y={34} textAnchor="end" fontFamily="Montserrat" fontWeight={500} fontSize={18} fill="#9fb0d0">
          {tm as string}
        </text>
      </g>
    ))}
    <rect x={14} y={520} width={SW - 28} height={110} rx={18} fill="#16203a" />
    <text x={34} y={560} fontFamily="Montserrat" fontWeight={600} fontSize={18} fill="#9fb0d0">
      Мой номер
    </text>
    <text x={34} y={598} fontFamily="Montserrat" fontWeight={800} fontSize={26} fill={highlight > 0.5 ? '#ffcf4a' : '#fff'}>
      {MY_NUMBER}
    </text>
  </g>
);

const CAM_LIGHT: Light = {x: 0, y: -0.9, rim: '#cfe0ff', rimStrength: 0.35, shade: '#0b0f18', shadeStrength: 0.5};

/**
 * Home-camera app: night-vision-ish blue-grey feed, REC dot, timestamp.
 * clip 'hall' — Artyom comes in through the front door (23:54).
 * clip 'room' — Artyom at the desk; the other Artyom walks behind him (23:58).
 */
export const CameraScreen: React.FC<{time: string; clip: 'hall' | 'room'; t: number; stamp: string}> = ({time, clip, t, stamp}) => {
  const f = useCurrentFrame();
  const W = SW;
  const H = 560;
  const noiseY = (f * 37) % H;
  let fig: React.ReactNode = null;
  if (clip === 'hall') {
    const k = Math.min(1, t / 3.6);
    const cyc = walk(t * 0.9, k < 1 ? 0.8 : 0);
    const p: Pose = {...basePose(), bodyTurn: 0.1, headTurn: 0.1, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR, headNod: 0.25};
    fig = <Character design={ARTEM} pose={p} light={CAM_LIGHT} x={200 + 30 * k} y={250 + 120 * k} scale={0.16 + 0.12 * k} idp="cam-h" />;
  } else {
    const seated: Pose = {...basePose(), bodyTurn: 3.7, headTurn: 3.7, legL: {hip: 84, knee: 88, foot: 0}, legR: {hip: 80, knee: 84, foot: 0}, armL: {shoulder: 40, elbow: 40, wrist: 0, hand: 'type'}, armR: {shoulder: 40, elbow: 40, wrist: 0, hand: 'type'}};
    const wk = Math.max(0, Math.min(1, (t - 0.6) / 4.6));
    const cyc = walk(t * 0.8, wk > 0 && wk < 1 ? 0.7 : 0);
    const walker: Pose = {...basePose(), bodyTurn: 0.9, headTurn: 0.4, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR};
    fig = (
      <g>
        {wk > 0 && wk < 1 ? <Character design={ARTEM} pose={walker} light={CAM_LIGHT} x={-20 + 440 * wk} y={300} scale={0.26} idp="cam-w" /> : null}
        <Character design={ARTEM} pose={seated} light={CAM_LIGHT} x={200} y={390} scale={0.24} idp="cam-s" />
      </g>
    );
  }
  return (
    <g>
      <rect width={SW} height={SH} fill="#05070c" />
      <Status time={time} />
      <text x={28} y={96} fontFamily="Montserrat" fontWeight={800} fontSize={28} fill="#fff">
        Дом · {clip === 'hall' ? 'Прихожая' : 'Комната'}
      </text>
      <g transform="translate(0 130)">
        <clipPath id="cam-clip">
          <rect width={W} height={H} />
        </clipPath>
        <g clipPath="url(#cam-clip)">
          <rect width={W} height={H} fill="#1d2633" />
          {clip === 'hall' ? (
            <g>
              <path d={`M0 0 L140 140 L140 420 L0 ${H}Z`} fill="#26303e" />
              <path d={`M${W} 0 L260 140 L260 420 L${W} ${H}Z`} fill="#222b38" />
              <rect x={140} y={140} width={120} height={280} fill="#3a3a3e" stroke="#11151c" strokeWidth={4} />
              <path d={`M0 ${H} L140 420 L260 420 L${W} ${H}Z`} fill="#161d27" />
            </g>
          ) : (
            <g>
              <rect width={W} height={H * 0.62} fill="#232c3a" />
              <rect x={250} y={60} width={120} height={150} fill="#2f3b4e" stroke="#c9d3e0" strokeWidth={3} />
              <rect x={60} y={300} width={300} height={14} fill="#3a3a3e" />
              <rect x={150} y={230} width={120} height={70} fill="#0b0f16" />
              <rect x={156} y={236} width={108} height={58} fill="#3d5a86" opacity={0.6} />
              <rect y={H * 0.62} width={W} height={H * 0.38} fill="#171e28" />
            </g>
          )}
          {fig}
          {/* night-vision look: desaturating tint, scanline, noise band */}
          <rect width={W} height={H} fill="#7d9bc4" opacity={0.18} />
          <rect y={noiseY} width={W} height={10} fill="#fff" opacity={0.06} />
          {Array.from({length: 40}).map((_, i) => (
            <rect key={i} x={rand(i * 7 + f) * W} y={rand(i * 13 + f * 3) * H} width={2} height={2} fill="#fff" opacity={0.25} />
          ))}
        </g>
        <circle cx={W - 70} cy={34} r={10} fill="#ff3b30" opacity={Math.floor(f / 15) % 2 ? 1 : 0.3} />
        <text x={W - 52} y={42} fontFamily="Montserrat" fontWeight={800} fontSize={22} fill="#fff">
          REC
        </text>
        <text x={16} y={H - 18} fontFamily="Montserrat" fontWeight={700} fontSize={22} fill="#fff" opacity={0.9}>
          {stamp}
        </text>
      </g>
      <rect x={20} y={720} width={SW - 40} height={8} rx={4} fill="#24304a" />
      <rect x={20} y={720} width={(SW - 40) * Math.min(1, t / 5)} height={8} rx={4} fill="#7aa7ff" />
    </g>
  );
};

/** The device in a hand; `children` is the screen (drawn in SW×SH space). */
export const ZPhone: React.FC<{x: number; y: number; scale?: number; rot?: number; children: React.ReactNode; screen?: number; skin?: string; skinShade?: string; vibrate?: number}> = ({
  x,
  y,
  scale = 1,
  rot = 0,
  children,
  screen = 1,
  skin = ARTEM.skin,
  skinShade = ARTEM.skinShade,
  vibrate = 0,
}) => {
  const f = useCurrentFrame();
  const W = 440;
  const H = 900;
  const vx = vibrate ? Math.sin(f * 2.7) * 4 * vibrate : 0;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${x + vx} ${y}) rotate(${rot}) scale(${scale})`}>
        <path d={`M${-W / 2 - 40} ${H * 0.05} Q${-W / 2 - 70} ${H * 0.5} ${-W * 0.1} ${H * 0.62} L${W * 0.35} ${H * 0.62} Q${W / 2 + 60} ${H * 0.45} ${W / 2 + 30} ${H * 0.1}Z`} fill={skinShade} />
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={58} fill="#0c0d10" stroke="#3a3f48" strokeWidth={6} />
        <g transform={`translate(${-SW / 2} ${-SH / 2})`}>
          <clipPath id="zp-clip">
            <rect width={SW} height={SH} rx={40} />
          </clipPath>
          <g clipPath="url(#zp-clip)">
            {children}
            <rect width={SW} height={SH} fill="#000" opacity={1 - screen} />
            <path d={`M0 0 L${SW * 0.55} 0 L0 ${SH * 0.45}Z`} fill="#fff" opacity={0.05} />
          </g>
          <rect x={SW / 2 - 50} y={14} width={100} height={26} rx={13} fill="#000" />
        </g>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${W / 2 - 10} ${-H * 0.02 + i * 120} q46 6 52 46 q-4 40 -52 44 Z`} fill={skin} stroke="#3a2318" strokeOpacity={0.4} strokeWidth={2} />
        ))}
        <path d={`M${-W / 2 - 50} ${H * 0.2} Q${-W / 2 - 20} ${H * 0.02} ${-W / 2 + 30} ${H * 0.06} Q${-W / 2 + 46} ${H * 0.12} ${-W / 2 + 20} ${H * 0.18} Q${-W / 2 - 10} ${H * 0.28} ${-W / 2 - 50} ${H * 0.3}Z`} fill={skin} stroke="#3a2318" strokeOpacity={0.4} strokeWidth={2} />
        <path d={`M${-W * 0.35} ${H * 0.6} L${W * 0.42} ${H * 0.6} L${W * 0.5} ${H * 1.1} L${-W * 0.45} ${H * 1.1}Z`} fill="#8b9097" />
        <path d={`M${-W * 0.35} ${H * 0.6} L${W * 0.42} ${H * 0.6} L${W * 0.43} ${H * 0.66} L${-W * 0.36} ${H * 0.66}Z`} fill="#676c74" />
      </g>
    </svg>
  );
};
