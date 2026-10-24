// Training-centre exterior kit: overcast sky, barracks with sign, fence,
// watchtower, parade ground, and an animated military bus.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {noise, rand} from '../../animation/core';
import {P, smoothPath} from '../../characters/geometry';

export const OvercastSky: React.FC<{id?: string}> = ({id = 'oc'}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-s`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6f777d" />
          <stop offset="0.45" stopColor="#a6adb0" />
          <stop offset="0.6" stopColor="#c3c6c4" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2400} fill={`url(#${id}-s)`} />
      {Array.from({length: 7}).map((_, i) => {
        const y = 120 + i * 110;
        const dx = (frame * 0.4 * (1 + i * 0.1)) % 300;
        const pts: P[] = [];
        for (let k = 0; k <= 9; k++) pts.push([-400 + k * 220 + dx, y + noise(k * 0.8, i) * 30]);
        for (let k = 9; k >= 0; k--) pts.push([-400 + k * 220 + dx, y + 80 + noise(k * 1.1, i + 4) * 40]);
        return <path key={i} d={smoothPath(pts, true)} fill={i % 2 ? '#8b9296' : '#9aa1a4'} opacity={0.55} />;
      })}
    </svg>
  );
};

export const Barracks: React.FC<{x: number; y: number; w: number; h: number; sign?: boolean}> = ({x, y, w, h, sign}) => {
  const cols = Math.floor(w / 110);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#8d8f88" />
      <rect x={x} y={y} width={w} height={h} fill="url(#barrackShade)" />
      <rect x={x - 14} y={y - 30} width={w + 28} height={36} fill="#5f625d" />
      {Array.from({length: cols}).map((_, c) =>
        [0, 1].map((r) => (
          <g key={`${c}-${r}`}>
            <rect x={x + 40 + c * 110} y={y + 50 + r * (h / 2 - 10)} width={60} height={h / 2 - 90} fill="#3d464d" />
            <rect x={x + 40 + c * 110} y={y + 50 + r * (h / 2 - 10)} width={60} height={(h / 2 - 90) * 0.4} fill="#8fa1ad" opacity={0.35} />
            <rect x={x + 36 + c * 110} y={y + 50 + r * (h / 2 - 10) + h / 2 - 92} width={68} height={8} fill="#a9aba4" />
          </g>
        )),
      )}
      {sign ? (
        <g>
          <rect x={x + w / 2 - 230} y={y + 8} width={460} height={64} fill="#2f3a2c" stroke="#c9c9bf" strokeWidth={4} />
          <text x={x + w / 2} y={y + 55} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={42} fill="#f0efe6" letterSpacing={3}>
            УЧЕБНЫЙ ЦЕНТР
          </text>
        </g>
      ) : null}
      {/* entrance */}
      <rect x={x + w / 2 - 70} y={y + h - 190} width={140} height={190} fill="#2c2f2c" />
      <rect x={x + w / 2 - 100} y={y + h - 210} width={200} height={24} fill="#6c6f6a" />
      {/* stains */}
      {Array.from({length: 6}).map((_, i) => (
        <rect key={i} x={x + rand(i * 3) * w} y={y + h * 0.1} width={8 + rand(i) * 10} height={h * (0.4 + rand(i * 5) * 0.4)} fill="#6d6f69" opacity={0.25} />
      ))}
    </g>
  );
};

export const Fence: React.FC<{y: number; from?: number; to?: number}> = ({y, from = -200, to = 1300}) => (
  <g>
    {Array.from({length: Math.ceil((to - from) / 150)}).map((_, i) => (
      <g key={i}>
        <rect x={from + i * 150} y={y - 170} width={146} height={170} fill="#9a9b93" />
        <path d={`M${from + i * 150} ${y - 120} h146 M${from + i * 150} ${y - 60} h146`} stroke="#86877f" strokeWidth={3} />
        <rect x={from + i * 150 + 140} y={y - 190} width={12} height={190} fill="#7d7e77" />
      </g>
    ))}
    <path d={`M${from} ${y - 196} ${Array.from({length: 60}).map((_, i) => `L${from + i * 25} ${y - 196 - (i % 2) * 10}`).join(' ')}`} stroke="#4a4b47" strokeWidth={2} fill="none" />
  </g>
);

export const Watchtower: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#3c3a35" strokeWidth={6}>
    <path d="M-60 0 L-30 -420 M60 0 L30 -420 M-50 -140 L50 -140 M-40 -280 L40 -280 M-55 -10 L35 -280 M55 -10 L-35 -280" fill="none" />
    <rect x={-70} y={-520} width={140} height={100} fill="#4b4a43" />
    <rect x={-56} y={-505} width={112} height={50} fill="#262724" stroke="none" />
    <path d="M-90 -520 L0 -580 L90 -520Z" fill="#3a3a34" />
  </g>
);

export const ParadeGround: React.FC<{y: number; id?: string}> = ({y, id = 'pg'}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    <defs>
      <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#7c7f7d" />
        <stop offset="1" stopColor="#4c4f4f" />
      </linearGradient>
    </defs>
    <rect x={-300} y={y} width={1680} height={1400} fill={`url(#${id}-g)`} />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M-300 ${y + 40 + i * i * 70} L1380 ${y + 40 + i * i * 70}`} stroke="#e8e6dc" strokeWidth={4 + i * 3} opacity={0.35} strokeDasharray={`${60 + i * 40} ${40 + i * 30}`} />
    ))}
    {[[200, y + 300, 160], [760, y + 520, 220]].map(([cx, cy, r], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.16} fill="#9ea6aa" opacity={0.35} />
    ))}
    {Array.from({length: 30}).map((_, i) => (
      <circle key={i} cx={rand(i * 5.3) * 1080} cy={y + 20 + rand(i * 2.1) * 900} r={1.5 + rand(i) * 2.5} fill="#3b3d3d" opacity={0.5} />
    ))}
  </svg>
);

/** Boxy military bus. doorOpen 0..1, wheel rotation from distance travelled. */
export const Bus: React.FC<{x: number; y: number; s: number; doorOpen: number; dist: number; pitch?: number; face?: 1 | -1}> = ({x, y, s, doorOpen, dist, pitch = 0, face = 1}) => {
  const W = 760;
  const H = 300;
  const wheelRot = (dist / (2 * Math.PI * 48)) * 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      <ellipse cx={0} cy={8} rx={W * 0.55} ry={22} fill="#000" opacity={0.35} />
      <g transform={`rotate(${pitch} ${-W * 0.3} -40)`}>
        <rect x={-W / 2} y={-H - 40} width={W} height={H} rx={34} fill="#56603f" stroke="#2a2e20" strokeWidth={4} />
        <rect x={-W / 2} y={-110} width={W} height={40} fill="#4a5336" />
        <rect x={-W / 2} y={-H - 40} width={W} height={40} rx={20} fill="#646e4b" />
        {/* windows */}
        {Array.from({length: 5}).map((_, i) => (
          <g key={i}>
            <rect x={-W / 2 + 150 + i * 112} y={-H + 20} width={96} height={110} rx={8} fill="#2b343a" />
            <rect x={-W / 2 + 150 + i * 112} y={-H + 20} width={96} height={40} rx={8} fill="#8fa4ae" opacity={0.35} />
          </g>
        ))}
        {/* windshield / front (left side when face=-1 after flip) */}
        <path d={`M${-W / 2 + 10} ${-H + 4} L${-W / 2 + 120} ${-H + 4} L${-W / 2 + 120} ${-H + 150} L${-W / 2 + 4} ${-H + 150}Z`} fill="#33424a" />
        <rect x={-W / 2 + 4} y={-130} width={26} height={22} rx={6} fill="#f6e7b0" />
        {/* door (front-side), slides open */}
        <rect x={-W / 2 + 128} y={-H + 4} width={86} height={H - 50} fill="#1b1f1c" />
        <rect x={-W / 2 + 128 + doorOpen * 40} y={-H + 4} width={43 * (1 - doorOpen * 0.8)} height={H - 50} fill="#4a5336" stroke="#2a2e20" strokeWidth={3} />
        <rect x={-W / 2 + 171 - doorOpen * 0} y={-H + 4} width={43 * (1 - doorOpen * 0.8)} height={H - 50} fill="#4a5336" stroke="#2a2e20" strokeWidth={3} transform={`translate(${doorOpen * 30} 0)`} />
      </g>
      {[-W / 2 + 140, W / 2 - 150].map((wx) => (
        <g key={wx} transform={`translate(${wx} -30) rotate(${wheelRot})`}>
          <circle r={50} fill="#1a1a1a" />
          <circle r={26} fill="#5a5d55" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={14 * Math.cos((a * Math.PI) / 180)} cy={14 * Math.sin((a * Math.PI) / 180)} r={4} fill="#2b2d29" />
          ))}
        </g>
      ))}
    </g>
  );
};

export const BarrackDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <linearGradient id="barrackShade" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.25} />
      </linearGradient>
    </defs>
  </svg>
);
