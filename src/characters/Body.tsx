// Body rig: torso on a rotated ellipse (so it narrows/turns with bodyTurn),
// jointed limbs (shoulder → elbow → wrist, hip → knee → ankle) and layered
// outfits. Pelvis is the origin; y grows downwards.
import React from 'react';
import {Arm, Design, HandPose, Leg, Light, Pose} from './types';
import {P, add, limbPath, polar, profile, projEllipse, silhouette, smoothPath} from './geometry';
import {mixHex} from './Head';

const LINE = '#1d1a17';
const BODY_TURN_MAX = 0.85;

const TW: P[] = [[0, 60], [-40, 58], [-100, 54], [-160, 56], [-230, 64], [-290, 70], [-318, 73], [-334, 50], [-346, 30]];
const TD: P[] = [[0, 38], [-40, 36], [-100, 33], [-160, 36], [-230, 40], [-290, 38], [-318, 32], [-334, 26], [-346, 20]];
const TY = [0, -20, -40, -70, -100, -130, -160, -195, -230, -262, -290, -308, -318, -327, -334, -341, -346];

export type BodyGeo = {
  b: number;
  facing: number;
  W: (y: number) => number;
  D: (y: number) => number;
  pt: (phi: number, y: number, vol?: number) => {x: number; y: number; z: number; fs: number};
  edge: (y: number, vol?: number) => {l: number; r: number};
  shoulderY: number;
  neck: P;
  shoulder: (side: number) => P & {z?: number};
};

export const makeBodyGeo = (design: Design, pose: Pose): BodyGeo => {
  const b = pose.bodyTurn * BODY_TURN_MAX;
  const bw = design.bodyWidth;
  const breathe = pose.breathe;
  const W = (y: number) => profile(TW, y) * bw * (y < -180 ? 1 + breathe * 0.012 : 1);
  const D = (y: number) => profile(TD, y) * bw;
  const pt = (phi: number, y: number, vol = 0) => {
    const p = projEllipse(phi, W(y) + vol, D(y) + vol, b);
    return {x: p.x, y, z: p.z, fs: p.fs};
  };
  const edge = (y: number, vol = 0) => {
    const s = silhouette(W(y) + vol, D(y) + vol, b);
    return {l: s.cx - s.hw, r: s.cx + s.hw};
  };
  const lift = -pose.shoulderUp * 10 - breathe * 2.2;
  const shoulderY = -316 + lift;
  const shoulder = (side: number): P => {
    const p = projEllipse(side * Math.PI * 0.46, W(-316) - 14, D(-316) - 6, b);
    return [p.x, shoulderY + 6];
  };
  return {
    b,
    facing: pose.bodyTurn >= 0 ? 1 : -1,
    W,
    D,
    pt,
    edge,
    shoulderY,
    neck: [Math.sin(b) * 6, -346 + lift * 0.6],
    shoulder,
  };
};

type BodyProps = {design: Design; pose: Pose; light: Light; idp: string; layer: 'back' | 'front' | 'all'};

/** Arm segment positions for a given arm pose. */
export const armJoints = (bg: BodyGeo, side: number, arm: Arm, scale = 1) => {
  const s = bg.shoulder(side);
  const f = bg.facing;
  const upper = 138 * scale;
  const fore = 126 * scale;
  const a1 = -f * arm.shoulder + (side * f < 0 ? 0 : 0) + side * 4;
  const elbow = add(s, polar(upper, a1));
  const a2 = a1 - f * arm.elbow;
  const wrist = add(elbow, polar(fore, a2));
  return {s, elbow, wrist, a1, a2, a3: a2 - f * arm.wrist};
};

export const legJoints = (side: number, leg: Leg, facing: number, scale = 1) => {
  const hip: P = [side * 30, -6];
  const a1 = -facing * leg.hip;
  const knee = add(hip, polar(212 * scale, a1));
  const a2 = a1 + facing * leg.knee;
  const ankle = add(knee, polar(204 * scale, a2));
  return {hip, knee, ankle, a1, a2};
};

// --------- outfits ---------
const outfitStyle = (d: Design) => {
  const c = d.colors;
  switch (d.outfit) {
    case 'gleb_civil':
      return {sleeve: c.top, sleeveShade: c.topShade, cuff: c.under, upperW: 46, foreW: 40};
    case 'gleb_military':
    case 'soldier':
    case 'field':
    case 'commander':
    case 'officer_dress':
      return {sleeve: c.top, sleeveShade: c.topShade, cuff: c.topShade, upperW: 46, foreW: 40};
    case 'student_hoodie':
    case 'student_sweater':
      return {sleeve: c.top, sleeveShade: c.topShade, cuff: c.topShade, upperW: 42, foreW: 36};
    default:
      return {sleeve: c.top, sleeveShade: c.topShade, cuff: c.top, upperW: 40, foreW: 34};
  }
};

export const Hand: React.FC<{pose: HandPose; skin: string; shade: string; dir: number; scale?: number}> = ({pose, skin, shade, dir, scale = 1}) => {
  // local: wrist at origin, hand points down (+y). dir = which side the thumb faces.
  const s = dir;
  const stroke = {stroke: '#3a2318', strokeOpacity: 0.55, strokeWidth: 1.5};
  let body: React.ReactNode;
  switch (pose) {
    case 'fist':
      body = (
        <g>
          <path d={`M${-13} 2 Q${-16} 26 ${-8} 36 Q4 42 13 33 Q17 18 13 2 Z`} fill={skin} {...stroke} />
          <path d={`M${-8} 22 h18 M${-8} 30 h16`} stroke={shade} strokeWidth={1.4} />
          <path d={`M${s * 10} 6 Q${s * 18} 16 ${s * 8} 24`} fill={skin} {...stroke} />
        </g>
      );
      break;
    case 'open':
      body = (
        <g>
          <path d={`M-14 0 Q-17 22 -12 34 L-14 58 Q-10 62 -7 58 L-5 40 L-5 64 Q-1 68 2 64 L3 41 L6 62 Q10 65 12 60 L11 38 L15 52 Q19 54 19 49 L15 26 Q14 8 13 0 Z`} fill={skin} {...stroke} />
          <path d={`M${s * 12} 10 Q${s * 30} 18 ${s * 32} 30 Q${s * 28} 34 ${s * 22} 28 Q${s * 18} 24 ${s * 10} 24`} fill={skin} {...stroke} />
          <path d="M-8 32 Q0 36 10 30" fill="none" stroke={shade} strokeWidth={1.3} />
        </g>
      );
      break;
    case 'point':
      body = (
        <g>
          <path d={`M-13 2 Q-16 26 -8 36 Q4 42 13 33 Q17 18 13 2 Z`} fill={skin} {...stroke} />
          <path d={`M${s * 4} 30 L${s * 6} 66 Q${s * 9} 70 ${s * 12} 66 L${s * 12} 32 Z`} fill={skin} {...stroke} />
        </g>
      );
      break;
    case 'hold':
      body = (
        <g>
          <path d={`M-13 2 Q-17 26 -9 38 Q3 44 14 34 Q18 18 13 2 Z`} fill={skin} {...stroke} />
          <ellipse cx={s * 2} cy={28} rx={5} ry={7} fill={shade} />
          <path d={`M${s * 11} 8 Q${s * 20} 20 ${s * 6} 30`} fill={skin} {...stroke} />
        </g>
      );
      break;
    case 'type':
      body = (
        <g>
          <path d={`M-14 0 Q-16 20 -13 32 L-14 52 Q-10 56 -7 52 L-5 36 L-4 56 Q0 59 3 55 L4 36 L7 53 Q11 56 13 51 L11 32 Q14 12 13 0 Z`} fill={skin} {...stroke} />
          <path d={`M${s * 12} 8 Q${s * 24} 20 ${s * 20} 34`} fill="none" stroke={skin} strokeWidth={9} strokeLinecap="round" />
        </g>
      );
      break;
    default:
      body = (
        <g>
          <path d={`M-13 0 Q-17 24 -10 40 Q-2 50 8 44 Q15 36 14 18 L13 0 Z`} fill={skin} {...stroke} />
          <path d={`M${s * 10} 6 Q${s * 19} 18 ${s * 12} 30`} fill={skin} {...stroke} />
          <path d="M-6 36 Q2 41 9 36" fill="none" stroke={shade} strokeWidth={1.3} />
        </g>
      );
  }
  return <g transform={`scale(${scale})`}>{body}</g>;
};

const ArmView: React.FC<{design: Design; bg: BodyGeo; side: number; arm: Arm; far: boolean}> = ({design, bg, side, arm, far}) => {
  const st = outfitStyle(design);
  const j = armJoints(bg, side, arm, design.height);
  const tint = (c: string) => (far ? mixHex(c, '#000000', 0.18) : c);
  const upper = limbPath(j.s, j.elbow, st.upperW, st.upperW - 4, 0.1);
  const fore = limbPath(j.elbow, j.wrist, st.foreW, st.foreW - 6, 0.06);
  const handDir = bg.facing * (far ? 1 : 1);
  const cuffDir = polar(1, j.a2);
  return (
    <g>
      <path d={upper} fill={tint(st.sleeve)} stroke={LINE} strokeWidth={1.8} strokeOpacity={0.6} />
      {/* fold at elbow */}
      <path
        d={`M${j.elbow[0] - 10} ${j.elbow[1] - 4} q8 6 18 2`}
        fill="none"
        stroke={tint(st.sleeveShade)}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <g transform={`translate(${j.wrist[0]} ${j.wrist[1]}) rotate(${j.a3})`}>
        <Hand pose={arm.hand} skin={tint(design.skin)} shade={design.skinShade} dir={handDir} scale={design.height * (design.bodyWidth > 1.15 ? 1.1 : 1)} />
      </g>
      <path d={fore} fill={tint(st.sleeve)} stroke={LINE} strokeWidth={1.8} strokeOpacity={0.6} />
      <path d={limbPath(j.elbow, j.wrist, st.foreW * 0.35, st.foreW * 0.3)} fill={tint(st.sleeveShade)} opacity={0.5} transform={`translate(${-bg.facing * 6} 0)`} />
      {/* cuff */}
      <path
        d={`M${j.wrist[0] - cuffDir[1] * 17 - cuffDir[0] * 8} ${j.wrist[1] + cuffDir[0] * 17 - cuffDir[1] * 8} L${j.wrist[0] + cuffDir[1] * 17 - cuffDir[0] * 8} ${j.wrist[1] - cuffDir[0] * 17 - cuffDir[1] * 8}`}
        stroke={tint(st.cuff)}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </g>
  );
};

const LegView: React.FC<{design: Design; bg: BodyGeo; side: number; leg: Leg; far: boolean}> = ({design, bg, side, leg, far}) => {
  const c = design.colors;
  const j = legJoints(side * 0.9 * design.bodyWidth, leg, bg.facing, design.height);
  const tint = (x: string) => (far ? mixHex(x, '#000000', 0.2) : x);
  const thigh = limbPath(j.hip, j.knee, 62, 46, 0.08);
  const shin = limbPath(j.knee, j.ankle, 46, 38, 0.04);
  const f = bg.facing;
  const boot = design.outfit.match(/military|soldier|field|commander|officer/) !== null;
  const shoeLen = boot ? 66 : 70;
  const foot = `M${-20} ${-10} L${-22} 12 Q${-20} 22 ${-8} 22 L${shoeLen - 18} 22 Q${shoeLen} 22 ${shoeLen - 4} 8 Q${shoeLen - 16} -4 ${14} -12 Z`;
  return (
    <g>
      <path d={thigh} fill={tint(c.pants)} stroke={LINE} strokeWidth={1.8} strokeOpacity={0.6} />
      <path d={shin} fill={tint(c.pants)} stroke={LINE} strokeWidth={1.8} strokeOpacity={0.6} />
      <path d={limbPath(j.knee, j.ankle, 14, 10)} fill={tint(c.pantsShade)} opacity={0.55} transform={`translate(${-f * 11} 0)`} />
      <g transform={`translate(${j.ankle[0]} ${j.ankle[1] + 6}) scale(${f} 1) rotate(${leg.foot})`}>
        <path d={foot} fill={tint(c.shoes)} stroke={LINE} strokeWidth={1.8} />
        {!boot ? <path d={`M-22 14 L${shoeLen - 2} 14`} stroke={tint('#cfcac0')} strokeWidth={5} /> : <path d={`M-20 -4 L${shoeLen - 22} -2`} stroke="#00000055" strokeWidth={2} />}
        {!boot && c.shoes !== '#e9e6df' ? null : !boot ? <path d="M6 -6 l10 6 M14 -8 l10 6" stroke="#8f8a82" strokeWidth={1.5} /> : null}
      </g>
    </g>
  );
};

export const Torso: React.FC<{design: Design; pose: Pose; bg: BodyGeo; idp: string; light: Light}> = ({design, pose, bg, idp, light}) => {
  const c = design.colors;
  const right: P[] = [];
  const left: P[] = [];
  for (const y of TY) {
    const yy = y < -300 ? y - pose.shoulderUp * 10 * ((-300 - y) / 46) : y;
    const e = bg.edge(y, 2);
    let r = e.r;
    let l = e.l;
    if (y <= -318) {
      // trapezius slope toward neck
      const t = (y + 318) / -28;
      const n = 22 * design.bodyWidth;
      r = r + (bg.neck[0] + n - r) * t;
      l = l + (bg.neck[0] - n - l) * t;
    }
    right.push([r, yy]);
    left.push([l, yy]);
  }
  const torsoPath = smoothPath([...right, ...left.reverse()], true, 0.8);
  const front = bg.pt(0, -200);
  const showFront = front.z > 0;
  const shadeSide = light.x >= 0 ? -1 : 1;
  const sideShadow = (() => {
    const pts: P[] = [];
    for (const y of [-330, -290, -230, -160, -100, -40, 0]) {
      const p = bg.pt(shadeSide * 1.0, y);
      pts.push([p.x, y]);
    }
    for (const y of [0, -40, -100, -160, -230, -290, -330]) {
      const e = bg.edge(y, 6);
      pts.push([shadeSide > 0 ? e.r : e.l, y]);
    }
    return smoothPath(pts, true, 0.7);
  })();

  const P2 = (phi: number, y: number) => bg.pt(phi, y);
  const vis = (phi: number) => bg.pt(phi, -200).z > 0;
  const details: React.ReactNode[] = [];

  const collarV = (col: string, colShade: string, depth = 70) => {
    const l = P2(-0.32, -336);
    const r = P2(0.32, -336);
    const m = P2(0, -336 + depth);
    return <path key="collarV" d={`M${l.x} ${l.y} L${m.x} ${m.y} L${r.x} ${r.y} Q${(l.x + r.x) / 2} ${-344} ${l.x} ${l.y}Z`} fill={col} stroke={colShade} strokeWidth={1.5} />;
  };

  switch (design.outfit) {
    case 'gleb_civil': {
      // hoodie visible between open jacket panels
      const pl = [-0.42, -0.36, -0.3, -0.26];
      const pr = [0.42, 0.36, 0.3, 0.26];
      const ys = [-330, -250, -150, -20];
      const strip: P[] = [...ys.map((y, i): P => [P2(pr[i], y).x, y]), ...ys.slice().reverse().map((y, i): P => [P2(pl[3 - i], y).x, y])];
      if (showFront) {
        details.push(<path key="hood-front" d={smoothPath(strip, true, 0.6)} fill={c.under} stroke={c.underShade} strokeWidth={1.5} />);
        // hoodie pocket
        const pk = [P2(-0.24, -60), P2(0.24, -60), P2(0.22, -10), P2(-0.22, -10)];
        details.push(<path key="pocket" d={`M${pk[0].x} ${pk[0].y} Q${(pk[0].x + pk[1].x) / 2} ${-66} ${pk[1].x} ${pk[1].y} L${pk[2].x} ${pk[2].y} L${pk[3].x} ${pk[3].y}Z`} fill="none" stroke={c.underShade} strokeWidth={2} />);
        // drawstrings
        for (const s of [-0.1, 0.1]) {
          const t = P2(s, -330);
          details.push(<path key={`ds${s}`} d={`M${t.x} ${t.y} q${s * 20} 40 ${s * 8} 90`} stroke="#e9e7e2" strokeWidth={3} fill="none" strokeLinecap="round" />);
          details.push(<rect key={`dt${s}`} x={t.x + s * 8 - 2.5} y={t.y + 88} width={5} height={10} rx={2} fill="#bdbab3" />);
        }
        // jacket zipper edges & lapel shading
        for (const [i, s] of [-1, 1].entries()) {
          const a = P2(s * 0.42, -330);
          const bb = P2(s * 0.27, -20);
          details.push(<path key={`zip${i}`} d={`M${a.x} ${a.y} Q${P2(s * 0.37, -200).x} ${-200} ${bb.x} ${bb.y}`} stroke="#0c0d10" strokeWidth={3.5} fill="none" />);
          const pocketJ = P2(s * 0.68, -95);
          if (vis(s * 0.68)) details.push(<path key={`jp${i}`} d={`M${pocketJ.x - 16} ${-110} l${s * 6} 40`} stroke="#0d0e11" strokeWidth={3} />);
        }
      }
      // backpack straps
      for (const s of [-1, 1]) {
        const top = P2(s * 0.62, -334);
        const bot = P2(s * 0.75, -170);
        if (top.z > -10)
          details.push(
            <path key={`strap${s}`} d={`M${top.x - 9} ${top.y} Q${P2(s * 0.72, -260).x - 4} ${-260} ${bot.x - 8} ${bot.y} L${bot.x + 8} ${bot.y} Q${P2(s * 0.72, -260).x + 12} ${-260} ${top.x + 9} ${top.y}Z`} fill={c.accent} stroke={LINE} strokeWidth={1.2} />,
          );
      }
      break;
    }
    case 'gleb_military':
    case 'soldier': {
      // plate carrier
      const ys = [-318, -260, -180, -120];
      const l = ys.map((y): P => [P2(-0.82, y).x, y]);
      const r = ys.map((y): P => [P2(0.82, y).x, y]);
      if (showFront) {
        details.push(collarV(c.topShade, LINE, 40));
        details.push(<path key="vest" d={smoothPath([...r, ...l.reverse()], true, 0.5)} fill={c.under} stroke={LINE} strokeWidth={2} />);
        // pouches
        [-0.5, 0, 0.5].forEach((phi, i) => {
          const p = P2(phi, -170);
          const w = 38 * Math.max(0.3, p.fs);
          details.push(<rect key={`pch${i}`} x={p.x - w / 2} y={-200} width={w} height={64} rx={5} fill={mixHex(c.under, '#000', 0.12)} stroke={LINE} strokeWidth={1.4} />);
          details.push(<rect key={`pchf${i}`} x={p.x - w / 2} y={-200} width={w} height={14} rx={4} fill={mixHex(c.under, '#000', 0.25)} />);
        });
        // molle webbing
        for (const y of [-290, -270, -250]) {
          details.push(<path key={`mw${y}`} d={`M${P2(-0.6, y).x} ${y} L${P2(0.6, y).x} ${y}`} stroke={mixHex(c.under, '#000', 0.3)} strokeWidth={2.5} strokeDasharray="14 6" />);
        }
      }
      // shoulder straps of the carrier
      for (const s of [-1, 1]) {
        const top = P2(s * 0.5, -338);
        if (top.z > -10) details.push(<path key={`ss${s}`} d={`M${top.x - 12} ${top.y} L${top.x + 12} ${top.y} L${P2(s * 0.62, -300).x + 12} ${-300} L${P2(s * 0.62, -300).x - 12} ${-300}Z`} fill={c.under} stroke={LINE} strokeWidth={1.2} />);
      }
      break;
    }
    case 'officer_dress': {
      if (showFront) {
        details.push(collarV(c.under, c.underShade, 110));
        const t0 = P2(0, -326);
        details.push(<path key="tie" d={`M${t0.x - 6} ${-322} L${t0.x + 6} ${-322} L${t0.x + 9} ${-240} L${t0.x} ${-228} L${t0.x - 9} ${-240}Z`} fill="#2e3324" />);
        for (const s of [-1, 1]) {
          const a = P2(s * 0.32, -336);
          const m = P2(s * 0.05, -220);
          const o = P2(s * 0.5, -270);
          details.push(<path key={`lap${s}`} d={`M${a.x} ${a.y} L${m.x} ${m.y} L${o.x} ${o.y}Z`} fill={c.topShade} stroke={LINE} strokeWidth={1.2} />);
        }
        [-200, -150, -100, -50].forEach((y) => {
          const p = P2(0.08, y);
          details.push(<circle key={`btn${y}`} cx={p.x} cy={y} r={4.5} fill={c.accent} stroke="#6b5420" strokeWidth={1} />);
        });
        const rb = P2(-0.55, -270);
        if (vis(-0.55)) {
          ['#b03a2e', '#2f5aa0', '#d8b54a', '#3b7a46', '#b03a2e', '#e2e2e2'].forEach((col, i) => {
            details.push(<rect key={`rb${i}`} x={rb.x - 18 + (i % 3) * 12} y={-280 + Math.floor(i / 3) * 8} width={12} height={7} fill={col} stroke="#222" strokeWidth={0.6} />);
          });
        }
      }
      break;
    }
    case 'field':
    case 'commander': {
      if (showFront) {
        details.push(collarV(c.topShade, LINE, 56));
        const z = [P2(0.04, -280), P2(0.04, -20)];
        details.push(<path key="placket" d={`M${z[0].x} ${z[0].y} L${z[1].x} ${z[1].y}`} stroke={c.topShade} strokeWidth={3} />);
        for (const s of [-1, 1]) {
          const p = P2(s * 0.5, -240);
          if (!vis(s * 0.5)) continue;
          const w = 46 * Math.max(0.35, p.fs);
          details.push(<rect key={`cp${s}`} x={p.x - w / 2} y={-262} width={w} height={52} rx={4} fill={c.top} stroke={c.topShade} strokeWidth={2} />);
          details.push(<path key={`cpf${s}`} d={`M${p.x - w / 2} ${-262} h${w} v14 h${-w}z`} fill={c.topShade} opacity={0.7} />);
        }
        // belt
        details.push(<path key="belt" d={`M${bg.edge(-40).l} ${-44} L${bg.edge(-40).r} ${-44} L${bg.edge(-22).r} ${-24} L${bg.edge(-22).l} ${-24}Z`} fill="#3a3326" />);
        const bk = P2(0, -34);
        details.push(<rect key="buckle" x={bk.x - 10} y={-43} width={20} height={18} rx={2} fill="none" stroke="#a89160" strokeWidth={3} />);
      }
      // camo blotches
      if (design.outfit === 'field') {
        [[-0.5, -150, 30], [0.4, -90, 26], [0.7, -280, 22], [-0.8, -260, 24], [0.1, -300, 18]].forEach(([phi, y, r], i) => {
          const p = P2(phi, y);
          if (p.z > 0) details.push(<ellipse key={`cm${i}`} cx={p.x} cy={y} rx={r * Math.max(0.3, p.fs)} ry={r * 0.6} fill={c.topShade} opacity={0.45} />);
        });
      }
      break;
    }
    case 'student_hoodie': {
      if (showFront) {
        const pk = [P2(-0.3, -80), P2(0.3, -80), P2(0.36, -16), P2(-0.36, -16)];
        details.push(<path key="pk" d={`M${pk[0].x} ${pk[0].y} L${pk[1].x} ${pk[1].y} L${pk[2].x} ${pk[2].y} L${pk[3].x} ${pk[3].y}Z`} fill={c.topShade} opacity={0.5} />);
        for (const s of [-0.12, 0.12]) {
          const t = P2(s, -330);
          details.push(<path key={`ds${s}`} d={`M${t.x} ${t.y} l${s * 10} 80`} stroke="#ddd" strokeWidth={3} />);
        }
      }
      break;
    }
    case 'student_shirt': {
      if (showFront) {
        details.push(collarV(mixHex(c.top, '#fff', 0.2), c.topShade, 40));
        [-280, -220, -160, -100, -40].forEach((y) => {
          const p = P2(0, y);
          details.push(<circle key={y} cx={p.x} cy={y} r={3.5} fill="#eee" />);
        });
        details.push(<path key="plk" d={`M${P2(0, -300).x} -300 L${P2(0, 0).x} 0`} stroke={c.topShade} strokeWidth={2} />);
      }
      break;
    }
    case 'student_sweater': {
      if (showFront) {
        details.push(collarV(c.under, c.underShade, 34));
        // knit rib at hem
        details.push(<path key="hem" d={`M${bg.edge(-20).l} -26 L${bg.edge(-20).r} -26`} stroke={c.topShade} strokeWidth={6} />);
      }
      break;
    }
  }

  // hood / collar behind neck
  const hood =
    design.outfit === 'gleb_civil' || design.outfit === 'student_hoodie' ? (
      <g>
        <path
          d={`M${bg.neck[0] - 50} ${-326} Q${bg.neck[0] - 44} ${-362} ${bg.neck[0]} ${-360} Q${bg.neck[0] + 44} ${-362} ${bg.neck[0] + 50} ${-326} Q${bg.neck[0] + 34} ${-300} ${bg.neck[0] + 14} ${-296} L${bg.neck[0] + 18} ${-330} Q${bg.neck[0]} ${-338} ${bg.neck[0] - 18} ${-330} L${bg.neck[0] - 14} ${-296} Q${bg.neck[0] - 34} ${-300} ${bg.neck[0] - 50} ${-326}Z`}
          fill={design.outfit === 'gleb_civil' ? c.under : c.top}
          stroke={LINE}
          strokeWidth={1.4}
        />
        <path d={`M${bg.neck[0] - 40} ${-332} Q${bg.neck[0]} ${-350} ${bg.neck[0] + 40} ${-332}`} stroke={design.outfit === 'gleb_civil' ? c.underShade : c.topShade} strokeWidth={4} fill="none" />
      </g>
    ) : null;

  return (
    <g>
      <defs>
        <clipPath id={`${idp}-torso`}>
          <path d={torsoPath} />
        </clipPath>
      </defs>
      <path d={torsoPath} fill={c.top} stroke={LINE} strokeWidth={2} strokeOpacity={0.7} />
      <g clipPath={`url(#${idp}-torso)`}>
        {details}
        <path d={sideShadow} fill={c.topShade} opacity={0.55} />
        {/* fabric folds */}
        <path d={`M${bg.pt(-0.2, -120).x} -120 q14 22 4 50`} stroke={c.topShade} strokeWidth={2.5} fill="none" opacity={0.6} />
        <path d={`M${bg.pt(0.55, -170).x} -170 q-10 20 -2 46`} stroke={c.topShade} strokeWidth={2.5} fill="none" opacity={0.5} />
      </g>
      {hood}
    </g>
  );
};

export const Neck: React.FC<{design: Design; bg: BodyGeo; headX: number}> = ({design, bg, headX}) => {
  const n = bg.neck;
  const w = 22 * (0.9 + design.bodyWidth * 0.1);
  const top = n[1] - 14;
  return (
    <g>
      <path
        d={`M${n[0] - w} ${n[1] + 10} L${headX - w + 2} ${top} L${headX + w - 2} ${top} L${n[0] + w} ${n[1] + 10}Z`}
        fill={design.skin}
        stroke="#3a2318"
        strokeOpacity={0.45}
        strokeWidth={1.5}
      />
      <path d={`M${headX - w + 2} ${top + 4} Q${headX} ${top + 26} ${headX + w - 2} ${top + 4}Z`} fill={design.skinShade} opacity={0.75} />
    </g>
  );
};

export const BodyLayers: React.FC<BodyProps> = () => null;

export {ArmView, LegView};
