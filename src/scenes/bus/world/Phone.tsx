// Gleb's phone: device, hand, and screen states (lock screen time, no
// signal, the impossible photo in the gallery). Screens are drawn in a
// 400×860 local space and scaled into the device.
import React from 'react';
import {Character} from '../../../characters/Character';
import {GLEB_CIVIL} from '../../../characters/designs';
import {Light, basePose} from '../../../characters/types';

export type PhoneMode = 'off' | 'lock' | 'nosignal' | 'photo' | 'clock';

const SW = 400;
const SH = 860;

const StatusBar: React.FC<{time: string; signal: boolean}> = ({time, signal}) => (
  <g>
    <text x={28} y={40} fontFamily="Montserrat" fontWeight={700} fontSize={22} fill="#fff">
      {time}
    </text>
    {signal ? (
      [0, 1, 2, 3].map((i) => <rect key={i} x={300 + i * 9} y={34 - i * 5} width={6} height={6 + i * 5} rx={1} fill="#fff" />)
    ) : (
      <text x={258} y={40} fontFamily="Montserrat" fontWeight={700} fontSize={18} fill="#ff6b5b">
        Нет сети
      </text>
    )}
    <rect x={346} y={24} width={34} height={17} rx={4} fill="none" stroke="#fff" strokeWidth={2} />
    <rect x={349} y={27} width={14} height={11} rx={2} fill="#ffcf4a" />
  </g>
);

const LockScreen: React.FC<{time: string; date: string; signal: boolean; note?: string; noteOpacity?: number}> = ({time, date, signal, note, noteOpacity = 1}) => (
  <g>
    <defs>
      <linearGradient id="ph-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b2546" />
        <stop offset="0.6" stopColor="#3a2f52" />
        <stop offset="1" stopColor="#101524" />
      </linearGradient>
    </defs>
    <rect width={SW} height={SH} fill="url(#ph-wall)" />
    <circle cx={300} cy={620} r={160} fill="#5b4a86" opacity={0.25} />
    <StatusBar time={time} signal={signal} />
    <text x={SW / 2} y={250} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={112} fill="#f4f6fb" letterSpacing={-2}>
      {time}
    </text>
    <text x={SW / 2} y={300} textAnchor="middle" fontFamily="Montserrat" fontWeight={500} fontSize={24} fill="#c9d2e6">
      {date}
    </text>
    {note ? (
      <g opacity={noteOpacity}>
        <rect x={24} y={380} width={SW - 48} height={96} rx={22} fill="#ffffff" opacity={0.16} />
        <rect x={44} y={402} width={52} height={52} rx={12} fill="#7aa7ff" />
        <circle cx={70} cy={428} r={12} fill="#fff" />
        <text x={112} y={420} fontFamily="Montserrat" fontWeight={700} fontSize={21} fill="#fff">
          Галерея
        </text>
        <text x={112} y={452} fontFamily="Montserrat" fontWeight={500} fontSize={19} fill="#dfe6f5">
          {note}
        </text>
      </g>
    ) : null}
    <rect x={SW / 2 - 60} y={SH - 26} width={120} height={6} rx={3} fill="#fff" opacity={0.7} />
  </g>
);

const NIGHT_IN: Light = {x: -0.4, y: -0.8, rim: '#9fc4ff', rimStrength: 0.5, shade: '#1d2238', shadeStrength: 0.45};

/** The photo: Gleb in this very bus seat by the window, taken at 20:47. */
const PhotoScreen: React.FC<{t: number; time: string}> = ({time}) => {
  const p = {...basePose(), bodyTurn: 0.45, headTurn: 0.6, eyeX: 0.4, headNod: 0.1, legL: {hip: 82, knee: 84, foot: 0}, legR: {hip: 78, knee: 80, foot: 0},
    armL: {shoulder: 20, elbow: 50, wrist: 0, hand: 'relaxed' as const}, armR: {shoulder: 16, elbow: 48, wrist: 0, hand: 'relaxed' as const}, browWorry: 0.2, lidDrop: 0.2};
  return (
    <g>
      <rect width={SW} height={SH} fill="#000" />
      <StatusBar time={time} signal={false} />
      <text x={28} y={92} fontFamily="Montserrat" fontWeight={700} fontSize={22} fill="#fff">
        ‹ Галерея
      </text>
      {/* the photo itself */}
      <g transform="translate(0 150)">
        <rect x={0} y={0} width={SW} height={520} fill="#0b1020" />
        <rect x={20} y={40} width={SW - 40} height={250} rx={14} fill="#0f1730" stroke="#2a3140" strokeWidth={10} />
        {[[90, 120, 26], [250, 90, 18], [330, 170, 30], [160, 210, 14]].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r * 1.4} fill="#ffc46b" opacity={0.4} />
        ))}
        {Array.from({length: 18}).map((_, i) => (
          <circle key={`d${i}`} cx={30 + ((i * 97) % (SW - 60))} cy={50 + ((i * 53) % 230)} r={3 + (i % 3)} fill="#bcd2ff" opacity={0.35} />
        ))}
        <rect x={0} y={330} width={SW} height={190} fill="#3b2e4a" />
        <rect x={0} y={300} width={SW} height={40} fill="#4a3a5a" />
        <svg x={0} y={0} width={SW} height={520} viewBox="0 0 400 520">
          <Character design={GLEB_CIVIL} pose={p} light={NIGHT_IN} x={190} y={380} scale={0.42} idp="photo-g" />
        </svg>
        <rect x={0} y={0} width={SW} height={520} fill="#bcd2ff" opacity={0.06} />
      </g>
      <text x={SW / 2} y={720} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={26} fill="#fff">
        Сегодня, 20:47
      </text>
      <text x={SW / 2} y={756} textAnchor="middle" fontFamily="Montserrat" fontWeight={500} fontSize={18} fill="#9aa3b5">
        Автобус № 13 · IMG_2047
      </text>
      <rect x={SW / 2 - 60} y={SH - 26} width={120} height={6} rx={3} fill="#fff" opacity={0.7} />
    </g>
  );
};

/** Phone held in a hand. Origin = phone centre. `glow` brightens the face around it. */
export const PhoneInHand: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  mode: PhoneMode;
  time?: string;
  date?: string;
  t?: number;
  note?: string;
  noteOpacity?: number;
  screen?: number; // screen brightness 0..1
  skin?: string;
  skinShade?: string;
}> = ({x, y, scale = 1, rot = 0, mode, time = '23:47', date = 'вторник, 14 ноября', t = 0, note, noteOpacity, screen = 1, skin = GLEB_CIVIL.skin, skinShade = GLEB_CIVIL.skinShade}) => {
  const W = 440;
  const H = 900;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
        {/* palm behind */}
        <path d={`M${-W / 2 - 40} ${H * 0.05} Q${-W / 2 - 70} ${H * 0.5} ${-W * 0.1} ${H * 0.62} L${W * 0.35} ${H * 0.62} Q${W / 2 + 60} ${H * 0.45} ${W / 2 + 30} ${H * 0.1}Z`} fill={skinShade} />
        {/* device */}
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={58} fill="#0c0d10" stroke="#3a3f48" strokeWidth={6} />
        <g transform={`translate(${-SW / 2} ${-SH / 2})`}>
          <clipPath id="ph-clip">
            <rect width={SW} height={SH} rx={40} />
          </clipPath>
          <g clipPath="url(#ph-clip)">
            {mode === 'off' ? <rect width={SW} height={SH} fill="#030405" /> : null}
            {mode === 'lock' ? <LockScreen time={time} date={date} signal note={note} noteOpacity={noteOpacity} /> : null}
            {mode === 'nosignal' ? <LockScreen time={time} date={date} signal={false} /> : null}
            {mode === 'clock' ? <LockScreen time={time} date={date} signal={false} note={note} noteOpacity={noteOpacity} /> : null}
            {mode === 'photo' ? <PhotoScreen t={t} time={time} /> : null}
            <rect width={SW} height={SH} fill="#000" opacity={mode === 'off' ? 0 : 1 - screen} />
            {/* glass reflection */}
            <path d={`M0 0 L${SW * 0.55} 0 L0 ${SH * 0.45}Z`} fill="#fff" opacity={0.05} />
          </g>
          <rect x={SW / 2 - 50} y={14} width={100} height={26} rx={13} fill="#000" />
        </g>
        {/* fingers wrapping the right edge */}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${W / 2 - 10} ${-H * 0.02 + i * 120} q46 6 52 46 q-4 40 -52 44 Z`} fill={skin} stroke="#3a2318" strokeOpacity={0.4} strokeWidth={2} />
        ))}
        {/* thumb on the left edge */}
        <path d={`M${-W / 2 - 50} ${H * 0.2} Q${-W / 2 - 20} ${H * 0.02} ${-W / 2 + 30} ${H * 0.06} Q${-W / 2 + 46} ${H * 0.12} ${-W / 2 + 20} ${H * 0.18} Q${-W / 2 - 10} ${H * 0.28} ${-W / 2 - 50} ${H * 0.3}Z`} fill={skin} stroke="#3a2318" strokeOpacity={0.4} strokeWidth={2} />
        {/* sleeve */}
        <path d={`M${-W * 0.35} ${H * 0.6} L${W * 0.42} ${H * 0.6} L${W * 0.5} ${H * 1.1} L${-W * 0.45} ${H * 1.1}Z`} fill="#22252b" />
        <path d={`M${-W * 0.35} ${H * 0.6} L${W * 0.42} ${H * 0.6} L${W * 0.43} ${H * 0.66} L${-W * 0.36} ${H * 0.66}Z`} fill="#a3a7ad" />
      </g>
    </svg>
  );
};
