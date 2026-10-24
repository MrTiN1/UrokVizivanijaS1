// Interior kit: college classroom, assembly hall, office pieces, props
// (desk, monitor, keyboard, documents, lamp, window with blinds).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {rand, noise} from '../../animation/core';

// ---------------- classroom ----------------
export const ClassroomWall: React.FC<{id?: string}> = ({id = 'cw'}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e8d2ad" />
          <stop offset="0.5" stopColor="#d7bb92" />
          <stop offset="1" stopColor="#b8976d" />
        </linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#bfe0f2" />
          <stop offset="1" stopColor="#fff2d6" />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8a6446" />
          <stop offset="1" stopColor="#5a3f2c" />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={1500} fill={`url(#${id}-wall)`} />
      {/* ceiling */}
      <rect x={-200} y={-200} width={1480} height={330} fill="#efe2c8" />
      <rect x={-200} y={120} width={1480} height={14} fill="#c9b08a" />
      {[180, 560, 940].map((x) => (
        <g key={x}>
          <rect x={x - 110} y={40} width={220} height={26} rx={6} fill="#fffbee" />
          <rect x={x - 110} y={64} width={220} height={6} fill="#d8c8a6" />
        </g>
      ))}
      {/* windows (left wall seen at an angle) */}
      {[0, 1].map((i) => {
        const x = -60 + i * 330;
        return (
          <g key={i}>
            <rect x={x} y={230} width={280} height={560} fill={`url(#${id}-sky)`} />
            {/* trees outside */}
            {Array.from({length: 6}).map((_, k) => (
              <ellipse
                key={k}
                cx={x + 30 + k * 50 + noise(frame / 60, k + i) * 4}
                cy={620 - rand(k + i * 7) * 120}
                rx={60}
                ry={90}
                fill={k % 2 ? '#8fb56e' : '#a7c784'}
                opacity={0.75}
              />
            ))}
            <rect x={x} y={230} width={280} height={560} fill="none" stroke="#f4ead6" strokeWidth={18} />
            <rect x={x + 136} y={230} width={10} height={560} fill="#f4ead6" />
            <rect x={x} y={500} width={280} height={10} fill="#f4ead6" />
            <rect x={x - 16} y={786} width={312} height={22} fill="#e9dcc2" />
            {/* curtains */}
            <path d={`M${x - 40} 200 Q${x + 10} 500 ${x - 30} 830 L${x + 44} 830 Q${x + 60} 500 ${x + 40} 200Z`} fill="#b75d3e" opacity={0.9} />
            <path d={`M${x - 10} 210 Q${x + 18} 500 ${x - 4} 820`} stroke="#8e4229" strokeWidth={6} fill="none" />
          </g>
        );
      })}
      {/* board on the right */}
      <rect x={720} y={300} width={420} height={420} rx={6} fill="#2f4a3e" stroke="#a8875f" strokeWidth={14} />
      <g stroke="#e8efe9" strokeWidth={3} fill="none" opacity={0.75}>
        <path d="M760 380 h120 v60 h-120z M880 410 h60 M940 380 h90 v60 h-90z" />
        <path d="M770 520 q40 -40 80 0 t80 0 t80 0" />
        <text x={760} y={620} fill="#e8efe9" stroke="none" fontFamily="Oswald" fontSize={34}>
          f(x) = Σ aₙ·xⁿ
        </text>
      </g>
      {/* wainscot */}
      <rect x={-200} y={1030} width={1480} height={300} fill="#a77f58" />
      <rect x={-200} y={1030} width={1480} height={12} fill="#7f5d3e" />
      <rect x={-200} y={1300} width={1480} height={700} fill={`url(#${id}-floor)`} />
      {/* poster */}
      <rect x={520} y={360} width={150} height={200} fill="#f5efe2" stroke="#8b7356" strokeWidth={4} />
      <rect x={540} y={385} width={110} height={70} fill="#5f7ea6" />
      <path d="M540 480 h110 M540 500 h90 M540 520 h100" stroke="#9a8b78" strokeWidth={6} />
    </svg>
  );
};

export const Monitor: React.FC<{x: number; y: number; w: number; glow?: string; screen?: React.ReactNode; back?: boolean}> = ({x, y, w, glow = '#9ad0ff', screen, back}) => {
  const h = w * 0.62;
  return (
    <g>
      <rect x={x - w * 0.08} y={y + h * 0.95} width={w * 0.16} height={h * 0.25} fill="#2a2c31" />
      <rect x={x - w * 0.25} y={y + h * 1.18} width={w * 0.5} height={h * 0.07} rx={4} fill="#1f2125" />
      <rect x={x - w / 2} y={y} width={w} height={h} rx={w * 0.03} fill="#1b1d22" stroke="#0e0f12" strokeWidth={3} />
      {back ? (
        <rect x={x - w / 2 + 8} y={y + 8} width={w - 16} height={h - 16} rx={6} fill="#2a2d33" />
      ) : (
        <g>
          <rect x={x - w / 2 + w * 0.04} y={y + w * 0.04} width={w * 0.92} height={h - w * 0.08} fill={glow} />
          {screen}
        </g>
      )}
    </g>
  );
};

export const CodeScreenLines: React.FC<{x: number; y: number; w: number; h: number; t: number; seed?: number}> = ({x, y, w, h, t, seed = 1}) => {
  const rows = Math.floor(h / (h * 0.09));
  const typed = Math.floor(t * 9);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#1e2430" />
      <rect x={x} y={y} width={w * 0.22} height={h} fill="#232a38" />
      {Array.from({length: rows}).map((_, i) => {
        const indent = (Math.floor(rand(i * 3 + seed) * 3) * w) / 20;
        const len = (0.2 + rand(i * 7 + seed) * 0.5) * w * 0.7;
        const vis = i < Math.min(rows, 3 + Math.floor(typed / 6)) ? 1 : 0;
        const col = ['#7fb7ff', '#e6c07b', '#98c379', '#c678dd', '#abb2bf'][Math.floor(rand(i + seed * 5) * 5)];
        return <rect key={i} x={x + w * 0.26 + indent} y={y + h * 0.06 + i * h * 0.09} width={len} height={h * 0.035} rx={2} fill={col} opacity={vis * 0.9} />;
      })}
    </g>
  );
};

export const Desk: React.FC<{x: number; y: number; w: number; d?: number; color?: string}> = ({x, y, w, d = 60, color = '#c39a6b'}) => (
  <g>
    <path d={`M${x - w / 2} ${y} L${x + w / 2} ${y} L${x + w / 2 + d * 0.3} ${y + d} L${x - w / 2 - d * 0.3} ${y + d}Z`} fill={color} />
    <rect x={x - w / 2 - d * 0.3} y={y + d} width={w + d * 0.6} height={d * 0.35} fill="#8b6845" />
    <rect x={x - w / 2 - d * 0.3} y={y + d * 1.35} width={w + d * 0.6} height={d * 2.4} fill="#6f5236" />
    <rect x={x - w / 2 - d * 0.3} y={y + d * 1.35} width={w + d * 0.6} height={d * 0.25} fill="#000" opacity={0.25} />
  </g>
);

export const Keyboard: React.FC<{x: number; y: number; w: number; pressed?: number[]}> = ({x, y, w, pressed = []}) => {
  const h = w * 0.32;
  const rows = 5;
  const cols = 14;
  const kw = (w * 0.94) / cols;
  const kh = (h * 0.84) / rows;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={10} fill="#2b2e35" />
      <rect x={x - w / 2} y={y + h - 8} width={w} height={10} rx={5} fill="#16181c" />
      {Array.from({length: rows * cols}).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const down = pressed.includes(i);
        return (
          <g key={i}>
            <rect x={x - w / 2 + w * 0.03 + c * kw + 1.5} y={y + h * 0.06 + r * kh + (down ? 3 : 0) + 3} width={kw - 3} height={kh - 3} rx={4} fill="#121317" />
            <rect x={x - w / 2 + w * 0.03 + c * kw + 1.5} y={y + h * 0.06 + r * kh + (down ? 3 : 0)} width={kw - 3} height={kh - 5} rx={4} fill={down ? '#3d414a' : '#4a4f59'} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------- assembly hall ----------------
export const HallBackdrop: React.FC<{id?: string; slide?: React.ReactNode}> = ({id = 'hb', slide}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#3b3a3e" />
        <stop offset="1" stopColor="#59524b" />
      </linearGradient>
      <radialGradient id={`${id}-spot`} cx="0.5" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#fff3dc" stopOpacity={0.35} />
        <stop offset="1" stopColor="#fff3dc" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-300} y={-300} width={1680} height={1700} fill={`url(#${id}-w)`} />
    {/* side curtains */}
    {[-1, 1].map((s) => (
      <g key={s}>
        {Array.from({length: 6}).map((_, i) => (
          <rect key={i} x={s < 0 ? -300 + i * 40 : 1140 + i * 40} y={-200} width={42} height={1400} fill={i % 2 ? '#6b2128' : '#7d2a31'} />
        ))}
      </g>
    ))}
    {/* projection screen */}
    <rect x={150} y={250} width={780} height={500} fill="#e9ecef" stroke="#2a2a2a" strokeWidth={6} />
    {slide}
    <ellipse cx={540} cy={700} rx={700} ry={500} fill={`url(#${id}-spot)`} />
    {/* stage */}
    <rect x={-300} y={1000} width={1680} height={60} fill="#7a5638" />
    <rect x={-300} y={1060} width={1680} height={140} fill="#4a3324" />
    <rect x={-300} y={1000} width={1680} height={8} fill="#a77a52" />
  </svg>
);

export const Slide: React.FC<{reveal: number}> = ({reveal}) => {
  const items = ['Современная техника', 'Обучение', 'Карьерный рост', 'Стабильность'];
  return (
    <g>
      <rect x={156} y={256} width={768} height={488} fill="#f1f3f5" />
      <rect x={156} y={256} width={768} height={130} fill="#2f3e2c" />
      <text x={190} y={316} fontFamily="Oswald" fontWeight={700} fontSize={48} fill="#fff">
        КОНТРАКТНАЯ СЛУЖБА
      </text>
      <text x={190} y={366} fontFamily="Oswald" fontWeight={500} fontSize={36} fill="#f4c542">
        БЕСПИЛОТНЫЕ СИСТЕМЫ
      </text>
      {items.map((it, i) => (
        <g key={it} opacity={Math.min(1, Math.max(0, reveal * 4 - i))}>
          <circle cx={200} cy={440 + i * 66} r={14} fill="#3d5a3a" />
          <path d={`M193 ${440 + i * 66} l5 6 l10 -12`} stroke="#fff" strokeWidth={4} fill="none" />
          <text x={232} y={452 + i * 66} fontFamily="Montserrat" fontWeight={700} fontSize={32} fill="#2b2b2b">
            {it}
          </text>
        </g>
      ))}
      {/* drone pictogram */}
      <g transform="translate(760 520)" fill="#3d4a3a">
        <rect x={-40} y={-12} width={80} height={24} rx={10} />
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${s * 30} -6 L${s * 78} -34`} stroke="#3d4a3a" strokeWidth={8} />
            <path d={`M${s * 30} 6 L${s * 78} 34`} stroke="#3d4a3a" strokeWidth={8} />
            <ellipse cx={s * 82} cy={-38} rx={36} ry={6} />
            <ellipse cx={s * 82} cy={38} rx={36} ry={6} />
          </g>
        ))}
        <circle cx={0} cy={18} r={9} fill="#1d241c" />
      </g>
    </g>
  );
};

export const Podium: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <path d={`M${x - 110} ${y} L${x + 110} ${y} L${x + 90} ${y + 330} L${x - 90} ${y + 330}Z`} fill="#6b4a30" stroke="#3a281a" strokeWidth={4} />
    <rect x={x - 125} y={y - 18} width={250} height={26} rx={4} fill="#8a6342" />
    <path d={`M${x - 60} ${y + 70} h120 v80 h-120z`} fill="#c9a54a" opacity={0.6} />
    <path d={`M${x + 20} ${y - 16} q10 -60 40 -80`} stroke="#222" strokeWidth={5} fill="none" />
    <ellipse cx={x + 62} cy={y - 98} rx={10} ry={14} fill="#333" />
  </g>
);

/** Back of a seated audience member's head + shoulders (foreground rows). */
export const AudienceHead: React.FC<{x: number; y: number; s: number; hair: string; top: string; seed: number}> = ({x, y, s, hair, top, seed}) => {
  const frame = useCurrentFrame();
  const sway = noise(frame / 50, seed) * 4;
  return (
    <g transform={`translate(${x + sway} ${y}) scale(${s})`}>
      <path d="M-95 120 Q-90 40 -40 30 L40 30 Q90 40 95 120 L95 240 L-95 240Z" fill={top} />
      <rect x={-20} y={0} width={40} height={40} fill="#c79a7a" />
      <ellipse cx={0} cy={-40} rx={52} ry={60} fill={hair} />
      <ellipse cx={-50} cy={-30} rx={9} ry={16} fill="#c79a7a" />
      <ellipse cx={50} cy={-30} rx={9} ry={16} fill="#c79a7a" />
      <path d={`M-40 -70 Q0 -96 40 -70`} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={8} fill="none" />
    </g>
  );
};

// ---------------- office ----------------
export const OfficeRoom: React.FC<{id?: string; lamp?: number; window?: boolean; poster?: boolean; dark?: number}> = ({id = 'of', lamp = 1, window = true, poster = false, dark = 0}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={dark ? '#262a28' : '#b9b3a2'} />
        <stop offset="1" stopColor={dark ? '#3a3a33' : '#cfc7b2'} />
      </linearGradient>
      <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd28a" stopOpacity={0.55 * lamp} />
        <stop offset="1" stopColor="#ffd28a" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-300} y={-300} width={1680} height={1700} fill={`url(#${id}-w)`} />
    <rect x={-300} y={1150} width={1680} height={900} fill={dark ? '#1d1c18' : '#7a6a54'} />
    {window ? (
      <g>
        <rect x={620} y={260} width={380} height={560} fill={dark ? '#4a5a6a' : '#cfe0ea'} />
        {Array.from({length: 14}).map((_, i) => (
          <rect key={i} x={620} y={262 + i * 40} width={380} height={26} fill={dark ? '#20262c' : '#e9e4d6'} opacity={0.92} />
        ))}
        <rect x={620} y={260} width={380} height={560} fill="none" stroke={dark ? '#151719' : '#efe8da'} strokeWidth={14} />
      </g>
    ) : null}
    {poster ? (
      <g>
        <rect x={110} y={300} width={300} height={420} fill="#e7e1d0" stroke="#5c5347" strokeWidth={5} />
        <rect x={110} y={300} width={300} height={110} fill="#3c4a34" />
        <text x={130} y={348} fontFamily="Oswald" fontWeight={700} fontSize={36} fill="#fff">
          КОНТРАКТ
        </text>
        <text x={130} y={392} fontFamily="Oswald" fontWeight={500} fontSize={24} fill="#f2c94c">
          ВОЕННАЯ СЛУЖБА
        </text>
        <circle cx={260} cy={540} r={80} fill="none" stroke="#7c6b4f" strokeWidth={6} opacity={0.6} />
        <path d="M150 660 h220 M150 690 h180" stroke="#9b8f7b" strokeWidth={8} />
      </g>
    ) : null}
    <ellipse cx={300} cy={950} rx={600} ry={420} fill={`url(#${id}-lamp)`} />
  </svg>
);

export const Paper: React.FC<{x: number; y: number; w: number; rot?: number; title?: string; sign?: number; lines?: number; signed?: string}> = ({
  x,
  y,
  w,
  rot = 0,
  title,
  lines = 14,
  sign = 0,
}) => {
  const h = w * 1.36;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#f6f2e8" />
      {title ? (
        <text x={0} y={-h / 2 + w * 0.12} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={w * 0.065} fill="#2a2a2a">
          {title}
        </text>
      ) : null}
      {Array.from({length: lines}).map((_, i) => (
        <rect key={i} x={-w * 0.4} y={-h / 2 + w * 0.2 + i * w * 0.062} width={w * (0.6 + rand(i * 3.7) * 0.2)} height={w * 0.016} fill="#8c877c" opacity={0.7} />
      ))}
      {sign >= 0 ? <path d={`M${-w * 0.05} ${h / 2 - w * 0.16} h${w * 0.42}`} stroke="#555" strokeWidth={w * 0.006} /> : null}
    </g>
  );
};
