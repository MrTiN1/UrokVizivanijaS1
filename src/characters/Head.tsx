// Pseudo-3D puppet head. Every feature lives on an ellipsoid and is projected
// for the current head-turn angle, so one drawing covers front, 3/4 and
// profile views with smooth TurnHead animation and consistent proportions.
import React, {useMemo} from 'react';
import {Design, Light, Pose, Viseme} from './types';
import {P, profile, projEllipse, silhouette, smoothPath} from './geometry';

// ---- head volume tables (y: 0 = chin, negative = up) ----
const W_T: P[] = [[0, 17], [-10, 30], [-24, 41], [-40, 50], [-58, 56], [-73, 58.5], [-90, 60], [-110, 60], [-130, 56], [-150, 46], [-162, 32], [-171, 10]];
const F_T: P[] = [[0, 44], [-10, 50], [-24, 54], [-40, 58], [-58, 62], [-73, 60], [-90, 64], [-110, 62], [-130, 56], [-150, 44], [-162, 30], [-171, 6]];
const B_T: P[] = [[0, 18], [-10, 4], [-24, -12], [-40, -40], [-58, -62], [-73, -72], [-90, -78], [-110, -80], [-130, -78], [-150, -66], [-162, -50], [-171, -16]];
const SAMPLE_Y = [0, -4, -10, -17, -24, -32, -40, -49, -58, -66, -73, -82, -90, -100, -110, -120, -130, -140, -150, -157, -162, -167, -171];

export const TURN_MAX = 0.82; // radians at headTurn = ±1

type HeadGeo = {
  b: number;
  W: (y: number) => number;
  D: (y: number) => number;
  z0: (y: number) => number;
  pt: (phi: number, y: number, vol?: number) => {x: number; y: number; z: number; fs: number};
  edge: (y: number, vol?: number) => {l: number; r: number; cx: number};
};

export const makeHeadGeo = (design: Design, turn: number): HeadGeo => {
  const b = turn * TURN_MAX;
  const fw = design.faceWidth;
  const jaw = design.jaw;
  const W = (y: number) => {
    let w = profile(W_T, y) * fw;
    // square jaw widens the lower face
    if (y > -45) w += jaw * 9 * Math.sin(Math.PI * Math.min(1, (y + 45) / 45 + 0.05)) * (y < -2 ? 1 : 0.4);
    return w;
  };
  const F = (y: number) => profile(F_T, y);
  const B = (y: number) => profile(B_T, y);
  const z0 = (y: number) => (F(y) + B(y)) / 2;
  const D = (y: number) => (F(y) - B(y)) / 2;
  const pt = (phi: number, y: number, vol = 0) => {
    const p = projEllipse(phi, W(y) + vol, D(y) + vol, b, z0(y));
    return {x: p.x, y, z: p.z, fs: p.fs};
  };
  const edge = (y: number, vol = 0) => {
    const s = silhouette(W(y) + vol, D(y) + vol, b, z0(y));
    return {l: s.cx - s.hw, r: s.cx + s.hw, cx: s.cx};
  };
  return {b, W, D, z0, pt, edge};
};

// ---------------- mouth ----------------
export type MouthParams = {open: number; wide: number; round: number; teeth: number; tongue: number; press: number};
export const VISEME_PARAMS: Record<Viseme, MouthParams> = {
  X: {open: 0, wide: 0.92, round: 0, teeth: 0, tongue: 0, press: 0},
  A: {open: 0, wide: 0.86, round: 0, teeth: 0, tongue: 0, press: 1},
  B: {open: 0.2, wide: 1.02, round: 0, teeth: 1, tongue: 0, press: 0},
  C: {open: 0.42, wide: 1.06, round: 0, teeth: 0.8, tongue: 0.2, press: 0},
  D: {open: 0.78, wide: 1.0, round: 0.1, teeth: 0.45, tongue: 0.5, press: 0},
  E: {open: 0.55, wide: 0.72, round: 0.75, teeth: 0.2, tongue: 0.3, press: 0},
  F: {open: 0.26, wide: 0.55, round: 1, teeth: 0, tongue: 0, press: 0},
  G: {open: 0.16, wide: 0.96, round: 0, teeth: 1, tongue: 0, press: 0},
  H: {open: 0.5, wide: 0.96, round: 0, teeth: 0.5, tongue: 1, press: 0},
};
export const mixMouth = (a: MouthParams, b: MouthParams, t: number): MouthParams => ({
  open: a.open + (b.open - a.open) * t,
  wide: a.wide + (b.wide - a.wide) * t,
  round: a.round + (b.round - a.round) * t,
  teeth: a.teeth + (b.teeth - a.teeth) * t,
  tongue: a.tongue + (b.tongue - a.tongue) * t,
  press: a.press + (b.press - a.press) * t,
});

type Props = {
  design: Design;
  pose: Pose;
  light: Light;
  mouth?: MouthParams;
  idp: string; // unique id prefix for gradients/clips
};

const LINE = '#3a2318';

export const Head: React.FC<Props> = ({design, pose, light, mouth, idp}) => {
  const g = useMemo(() => makeHeadGeo(design, pose.headTurn), [design, pose.headTurn]);
  const sb = Math.sin(g.b);
  const facing = sb >= 0 ? 1 : -1;
  const nod = pose.headNod;
  const ny = nod * 7; // features drift with nod
  const shadowSide = light.x >= 0 ? -1 : 1;
  const backView = Math.cos(g.b) < -0.05;

  // ---------- silhouette ----------
  const outline = useMemo(() => {
    const right: P[] = [];
    const left: P[] = [];
    for (const y of SAMPLE_Y) {
      const e = g.edge(y);
      let r = e.r;
      let l = e.l;
      // facial relief on the side we are turned towards
      const relief =
        3.6 * Math.exp(-(((y + 52) / 9) ** 2)) - // cheekbone
        2.6 * Math.exp(-(((y + 77) / 7) ** 2)) + // eye socket
        2.0 * Math.exp(-(((y + 93) / 6) ** 2)); // brow ridge
      if (facing > 0) r += relief * Math.abs(sb);
      else l -= relief * Math.abs(sb);
      right.push([r, y]);
      left.push([l, y]);
    }
    return [...right, ...left.reverse()];
  }, [g, sb, facing]);
  const facePath = smoothPath(outline, true, 1);

  // ---------- features ----------
  const eyeY = -73 + ny;
  const eyePhi = 0.43;
  const es = design.eyeScale;
  const eyes = [-1, 1].map((side) => {
    const p = g.pt(side * eyePhi, eyeY);
    return {side, ...p};
  });
  const nose = g.pt(0, -44 + ny);
  const noseTipX = nose.x + sb * 10;
  const mouthP = g.pt(0, -22 + ny * 0.8);

  // ---------- ears ----------
  const ears = [-1, 1].map((side) => {
    const p = g.pt(side * Math.PI * 0.5, -74 + ny * 0.5, -3);
    return {side, ...p};
  });

  const sx = (fs: number) => Math.max(0.28, Math.min(1, fs * 1.08));

  const hairBehind = <HairBack g={g} design={design} pose={pose} />;
  const hairFront = pose.helmet ? null : <HairFront g={g} design={design} pose={pose} idp={idp} />;

  const skinGrad = `${idp}-skin`;
  return (
    <g>
      <defs>
        <linearGradient id={skinGrad} x1={shadowSide > 0 ? 0 : 1} x2={shadowSide > 0 ? 1 : 0} y1="0" y2="0.2">
          <stop offset="0" stopColor={design.skin} />
          <stop offset="0.62" stopColor={design.skin} />
          <stop offset="1" stopColor={mixHex(design.skin, design.skinShade, 0.55)} />
        </linearGradient>
        <clipPath id={`${idp}-faceclip`}>
          <path d={facePath} />
        </clipPath>
      </defs>
      {hairBehind}
      {ears.filter((e) => e.z > -26).map((e) => (
        <Ear key={e.side} x={e.x} y={e.y} side={e.side} z={e.z} design={design} b={g.b} />
      ))}
      <path d={facePath} fill={`url(#${skinGrad})`} stroke={LINE} strokeWidth={1.8} strokeOpacity={0.55} />
      {/* nose protrusion (visible in profile) */}
      <NoseShape nose={nose} tipX={noseTipX} g={g} design={design} ny={ny} shadowSide={shadowSide} />
      <g clipPath={`url(#${idp}-faceclip)`}>
        <FaceShading g={g} design={design} shadowSide={shadowSide} facing={facing} sb={sb} ny={ny} />
        {/* cheeks */}
        {eyes.map((e) =>
          e.z > 0 ? (
            <ellipse
              key={`blush${e.side}`}
              cx={g.pt(e.side * 0.62, -50 + ny).x}
              cy={-50 + ny}
              rx={11 * sx(g.pt(e.side * 0.62, -50).fs)}
              ry={6}
              fill="#e8836f"
              opacity={0.17}
            />
          ) : null,
        )}
        {pose.dirt > 0 ? <Dirt g={g} amount={pose.dirt} ny={ny} /> : null}
        {design.stubble ? <Stubble g={g} design={design} /> : null}
        {design.age > 0.2 ? <AgeLines g={g} design={design} ny={ny} pose={pose} /> : null}
      </g>
      <Mouth
        x={mouthP.x}
        y={mouthP.y}
        sx={0.45 + 0.55 * sx(mouthP.fs)}
        smile={pose.smile}
        m={mouth ?? VISEME_PARAMS[pose.mouth]}
        jaw={pose.jaw}
        design={design}
        idp={idp}
      />
      {design.mustache ? <Mustache x={mouthP.x} y={mouthP.y} sx={0.45 + 0.55 * sx(mouthP.fs)} design={design} /> : null}
      {eyes.map((e) =>
        e.z > 2 ? (
          <Eye
            key={e.side}
            x={e.x}
            y={e.y}
            side={e.side}
            sx={sx(e.fs)}
            pose={pose}
            design={design}
            es={es}
            idp={`${idp}-e${e.side}`}
            light={light}
          />
        ) : null,
      )}
      {design.glasses ? <Glasses eyes={eyes} es={es} g={g} ny={ny} /> : null}
      {pose.sweat > 0 ? (
        <path
          d={`M${g.pt(facing * 0.85, -100).x} ${-104}q4 9 0 12q-4 -3 0 -12z`}
          fill="#dff2ff"
          stroke="#8fb3c8"
          strokeWidth={0.8}
          opacity={pose.sweat * 0.9}
        />
      ) : null}
      {hairFront}
      {!backView
        ? eyes.map((e) =>
            e.z > 2 ? (
              <g key={`b${e.side}`} opacity={pose.helmet ? 1 : 0.92}>
                <Eye x={e.x} y={e.y} side={e.side} sx={sx(e.fs)} pose={pose} design={design} es={es} idp={`${idp}-b${e.side}`} light={light} part="brow" />
              </g>
            ) : null,
          )
        : null}
      {backView ? <BackHairMass g={g} design={design} helmet={pose.helmet} /> : null}
      {pose.helmet ? <Helmet g={g} design={design} pose={pose} idp={idp} light={light} /> : null}
    </g>
  );
};

// ---------- helpers ----------
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const gg = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((1 << 24) + (r << 16) + (gg << 8) + bl).toString(16).slice(1)}`;
};

const FaceShading: React.FC<{g: HeadGeo; design: Design; shadowSide: number; facing: number; sb: number; ny: number}> = ({
  g,
  design,
  shadowSide,
  sb,
  ny,
}) => {
  // Cel-shaded form shadow on the side away from the light, terminator wraps
  // around the cheekbone and eye socket.
  const pts: P[] = [];
  const ys = [-150, -130, -110, -92, -80, -66, -54, -40, -26, -12, 0];
  const term = (y: number) => {
    const phiT = shadowSide * (0.95 - 0.25 * Math.exp(-(((y + 76) / 12) ** 2)) + 0.12 * Math.exp(-(((y + 50) / 10) ** 2)));
    return g.pt(phiT, y).x;
  };
  for (const y of ys) pts.push([term(y), y]);
  const edgeSide = ys.slice().reverse().map((y): P => {
    const e = g.edge(y, 4);
    return [shadowSide > 0 ? e.r + 6 : e.l - 6, y];
  });
  const d = smoothPath([...pts, ...edgeSide], true, 0.8);
  // under-nose / under-lip / eye socket accents
  const sock = (side: number) => {
    const p = g.pt(side * 0.43, -80 + ny);
    return <ellipse key={side} cx={p.x} cy={p.y - 2} rx={16 * Math.max(0.3, p.fs)} ry={7} fill={design.skinShade} opacity={0.22} />;
  };
  const lip = g.pt(0, -12 + ny * 0.8);
  void sb;
  return (
    <g>
      <path d={d} fill={design.skinShade} opacity={0.62} />
      {[-1, 1].map((s) => (g.pt(s * 0.43, -80).z > 0 ? sock(s) : null))}
      <ellipse cx={lip.x} cy={lip.y} rx={8} ry={3} fill={design.skinShade} opacity={0.4} />
      {/* jaw shadow onto neck side */}
      <ellipse cx={g.pt(0, -2).x} cy={2} rx={20} ry={6} fill={design.skinShade} opacity={0.35} />
    </g>
  );
};

const NoseShape: React.FC<{nose: {x: number; y: number; z: number}; tipX: number; g: HeadGeo; design: Design; ny: number; shadowSide: number}> = ({
  nose,
  tipX,
  g,
  design,
  ny,
  shadowSide,
}) => {
  const bridge = g.pt(0, -68 + ny);
  const base = g.pt(0, -36 + ny);
  const sb = Math.sin(g.b);
  const absb = Math.abs(sb);
  const tipY = nose.y;
  // protrusion polygon (skin coloured) – only shows outside face in profile
  const prot = `M${bridge.x} ${bridge.y} Q${(bridge.x + tipX) / 2 + sb * 3} ${(bridge.y + tipY) / 2} ${tipX} ${tipY + 1} Q${tipX - sb * 2} ${tipY + 6} ${base.x} ${base.y} Z`;
  // nostril / underside line
  const nx = tipX - sb * 4;
  const under = `M${nx - 5 + sb * 3} ${tipY + 3.5} Q${nx} ${tipY + 6.5} ${nx + 5 + sb * 3} ${tipY + 3.5}`;
  // side shadow of the nose (on the shadow side)
  const sideShadow = `M${bridge.x + shadowSide * 2} ${bridge.y + 16} Q${nose.x + shadowSide * 4} ${tipY - 6} ${nx + shadowSide * 3} ${tipY + 3} L${nx} ${tipY + 4} Q${nose.x + shadowSide * 1.5} ${tipY - 8} ${bridge.x} ${bridge.y + 16}Z`;
  return (
    <g>
      {absb > 0.3 ? <path d={prot} fill={design.skin} stroke={LINE} strokeOpacity={0.5 * absb} strokeWidth={1.5} /> : null}
      <path d={sideShadow} fill={design.skinShade} opacity={0.55} />
      <path d={under} fill="none" stroke={design.skinShade} strokeWidth={2.2} strokeLinecap="round" />
      <path d={under} fill="none" stroke={LINE} strokeOpacity={0.35} strokeWidth={1.1} strokeLinecap="round" />
    </g>
  );
};

const Ear: React.FC<{x: number; y: number; side: number; z: number; design: Design; b: number}> = ({x, y, side, design, b}) => {
  // ear seen from the side is wide, from the front narrow
  const open = Math.abs(Math.sin(side * Math.PI * 0.5 + b));
  const w = 7 + 9 * (1 - open) + 4;
  const s = side * (Math.cos(b) > 0 ? 1 : -1);
  const d = `M${x} ${y - 17} C${x + s * w} ${y - 22} ${x + s * (w + 4)} ${y - 4} ${x + s * (w - 2)} ${y + 6} C${x + s * (w - 5)} ${y + 15} ${x + s * 2} ${y + 17} ${x - s * 1} ${y + 12} Z`;
  const inner = `M${x + s * 2} ${y - 10} C${x + s * (w - 3)} ${y - 13} ${x + s * (w - 2)} ${y + 2} ${x + s * (w - 6)} ${y + 6}`;
  return (
    <g>
      <path d={d} fill={design.skin} stroke={LINE} strokeOpacity={0.55} strokeWidth={1.6} />
      <path d={inner} fill="none" stroke={design.skinShade} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
};

// ---------------- eyes ----------------
const Eye: React.FC<{
  x: number;
  y: number;
  side: number;
  sx: number;
  pose: Pose;
  design: Design;
  es: number;
  idp: string;
  light: Light;
  part?: 'eye' | 'brow';
}> = ({x, y, side, sx, pose, design, es, idp, light, part = 'eye'}) => {
  const ew = 33 * es;
  const eh = 22.5 * es;
  const blinkO = Math.max(0, 1 - pose.blink);
  const o = Math.max(0, Math.min(1.15, blinkO * (1 - pose.lidDrop * 0.55)));
  const sq = pose.squint * blinkO;
  const s = side; // outer corner direction
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const closedY = eh * 0.2;
  const up = (ox: number, oy: number): P => [ox, lerp(closedY + (ox * s) * 0.02, oy, o)];
  const upper: P[] = [
    [-s * ew * 0.5, eh * 0.1],
    up(-s * ew * 0.28, -eh * 0.36),
    up(s * ew * 0.04, -eh * 0.5),
    up(s * ew * 0.32, -eh * 0.42),
    [s * ew * 0.53, -eh * 0.06],
  ];
  const lowY = (k: number) => Math.max(lerp(closedY, eh * k, 1) * (1 - sq * 0.55), upper[2][1] + 0.5);
  const lower: P[] = [
    [s * ew * 0.53, -eh * 0.06],
    [s * ew * 0.25, lowY(0.4)],
    [-s * ew * 0.18, lowY(0.38)],
    [-s * ew * 0.5, eh * 0.1],
  ];
  const shape = smoothPath([...upper, ...lower.slice(1, 3)], true, 0.9);
  const upperPath = smoothPath(upper, false, 0.9);
  const lowerPath = smoothPath(lower.slice(0, 3), false, 0.9);
  const ir = eh * 0.47;
  const gx = pose.eyeX * ew * 0.2;
  const gy = pose.eyeY * eh * 0.16 + eh * 0.04;
  const pr = ir * 0.44 * pose.pupil;
  const hl = light.x >= 0 ? 1 : -1;
  const closed = o < 0.12;
  if (part === 'brow')
    return (
      <g transform={`translate(${x} ${y}) scale(${sx} 1)`}>
        <Brow s={s} ew={ew} eh={eh + 2} pose={pose} design={design} side={side} />
      </g>
    );
  const crease = smoothPath(
    [
      [-s * ew * 0.18, -eh * 0.62 * Math.max(o, 0.4) - 4],
      [s * ew * 0.12, -eh * 0.72 * Math.max(o, 0.4) - 4],
      [s * ew * 0.45, -eh * 0.42 - 2],
    ],
    false,
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`}>
      <defs>
        <clipPath id={`${idp}-c`}>
          <path d={shape} />
        </clipPath>
        <radialGradient id={`${idp}-ir`} cx="0.5" cy="0.62" r="0.6">
          <stop offset="0" stopColor={mixHex(design.iris, '#f1c58c', 0.35)} />
          <stop offset="0.55" stopColor={design.iris} />
          <stop offset="1" stopColor={mixHex(design.iris, '#120a06', 0.55)} />
        </radialGradient>
      </defs>
      {!closed ? (
        <g>
          <path d={shape} fill="#f7f2ec" />
          <g clipPath={`url(#${idp}-c)`}>
            <circle cx={gx} cy={gy} r={ir} fill={`url(#${idp}-ir)`} />
            <circle cx={gx} cy={gy} r={ir} fill="none" stroke="#24150d" strokeWidth={1.4} opacity={0.75} />
            <circle cx={gx} cy={gy + 0.5} r={pr} fill="#1a0f0a" />
            {/* upper lid cast shadow */}
            <path d={upperPath} fill="none" stroke="#4b3328" strokeOpacity={0.3} strokeWidth={eh * 0.42} />
            <ellipse cx={gx - hl * ir * 0.34} cy={gy - ir * 0.36} rx={ir * 0.3} ry={ir * 0.26} fill="#fff" opacity={0.95} />
            <circle cx={gx + hl * ir * 0.38} cy={gy + ir * 0.38} r={ir * 0.12} fill="#fff" opacity={0.85} />
          </g>
          {/* lashes */}
          <path d={upperPath} fill="none" stroke="#24150e" strokeWidth={3.4 * es} strokeLinecap="round" />
          <path d={lowerPath} fill="none" stroke="#3a2418" strokeWidth={1.3} strokeOpacity={0.55} strokeLinecap="round" />
          <path d={crease} fill="none" stroke={design.skinShade} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
        </g>
      ) : (
        <path
          d={smoothPath(
            [
              [-s * ew * 0.48, eh * 0.08],
              [s * ew * 0.04, eh * 0.24],
              [s * ew * 0.52, eh * 0.02],
            ],
            false,
          )}
          fill="none"
          stroke="#24150e"
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      {(pose.lidDrop > 0.25 || design.age > 0.4) && (
        <path
          d={`M${-s * ew * 0.25} ${eh * 0.55} Q${s * ew * 0.05} ${eh * 0.72} ${s * ew * 0.35} ${eh * 0.5}`}
          fill="none"
          stroke={design.skinShade}
          strokeWidth={1.2}
          opacity={0.45}
        />
      )}
    </g>
  );
};

const Brow: React.FC<{s: number; ew: number; eh: number; pose: Pose; design: Design; side: number}> = ({
  s,
  ew,
  eh,
  pose,
  design,
  side,
}) => {
  // side -1 = screen-left eye → character's right brow
  const raise = side < 0 ? pose.browR : pose.browL;
  const worry = pose.browWorry;
  const base = -eh * 0.5 - 12 - raise * 7;
  const t = design.browThick;
  const inner: P = [-s * ew * 0.48, base + 3 - worry * 6.5];
  const mid: P = [s * ew * 0.02, base - 3.5 + Math.abs(worry) * 0.8];
  const outer: P = [s * ew * 0.62, base + 4 + worry * 2.4];
  const top = smoothPath([inner, mid, outer], false);
  const bot = smoothPath(
    [
      [outer[0] - s * 1.5, outer[1] + 1.6 * t],
      [mid[0], mid[1] + 4.2 * t],
      [inner[0], inner[1] + 6.2 * t],
    ],
    false,
  ).replace(/^M/, 'L');
  return <path d={`${top}${bot}Z`} fill={design.browColor} stroke={design.browColor} strokeWidth={0.8} strokeLinejoin="round" />;
};

const Mouth: React.FC<{x: number; y: number; sx: number; smile: number; m: MouthParams; jaw: number; design: Design; idp: string}> = ({
  x,
  y,
  sx,
  smile,
  m,
  jaw,
  design,
  idp,
}) => {
  const open = Math.min(1, m.open + jaw * 0.6);
  const hw = 12.5 * m.wide * sx * (1 + smile * 0.12);
  const cornerY = y - smile * 3.6;
  const oh = 15 * open;
  const r = m.round;
  const L: P = [x - hw, cornerY];
  const R: P = [x + hw, cornerY];
  if (open < 0.04) {
    const mid = y + smile * 2.2 - m.press * 0.3;
    return (
      <g>
        <path
          d={`M${L[0]} ${L[1]} Q${x} ${mid + 1.2} ${R[0]} ${R[1]}`}
          fill="none"
          stroke="#7a3d33"
          strokeWidth={2.4 + m.press * 0.6}
          strokeLinecap="round"
        />
        <path d={`M${x - hw * 0.45} ${y + 6.5} Q${x} ${y + 8.5} ${x + hw * 0.45} ${y + 6.5}`} fill="none" stroke={design.skinShade} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
      </g>
    );
  }
  const topY = y - 1.5 - oh * (0.18 + r * 0.25);
  const botY = y + oh * (0.82 + r * 0.1) - smile * 1.5;
  const k = 0.55 + r * 0.45; // roundness pushes controls outward
  const d = `M${L[0]} ${L[1]} C${x - hw * k} ${topY} ${x + hw * k} ${topY} ${R[0]} ${R[1]} C${x + hw * k} ${botY + 2} ${x - hw * k} ${botY + 2} ${L[0]} ${L[1]} Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${idp}-m`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="#4f1d20" />
      <g clipPath={`url(#${idp}-m)`}>
        <rect x={x - hw} y={topY - 3} width={hw * 2} height={3 + oh * 0.32 * m.teeth + 1} fill="#f4eee6" />
        <ellipse cx={x} cy={botY + 1} rx={hw * 0.7} ry={oh * 0.32 + m.tongue * oh * 0.25} fill="#c4645f" />
      </g>
      <path d={d} fill="none" stroke="#6a2e29" strokeWidth={1.5} />
      <path d={`M${x - hw * 0.5} ${botY + 6} Q${x} ${botY + 8} ${x + hw * 0.5} ${botY + 6}`} fill="none" stroke={design.skinShade} strokeWidth={1.8} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

const Mustache: React.FC<{x: number; y: number; sx: number; design: Design}> = ({x, y, sx, design}) => (
  <path
    d={`M${x - 17 * sx} ${y - 1} Q${x - 9 * sx} ${y - 12} ${x} ${y - 8} Q${x + 9 * sx} ${y - 12} ${x + 17 * sx} ${y - 1} Q${x + 8 * sx} ${y - 4} ${x} ${y - 4} Q${x - 8 * sx} ${y - 4} ${x - 17 * sx} ${y - 1}Z`}
    fill={design.hair}
    stroke={design.hairShade}
    strokeWidth={1}
  />
);

const Dirt: React.FC<{g: HeadGeo; amount: number; ny: number}> = ({g, amount, ny}) => {
  const spots: [number, number, number, number][] = [
    [0.7, -48, 9, 4],
    [-0.62, -40, 7, 3],
    [0.35, -110, 10, 3],
    [-0.2, -18, 6, 2.5],
  ];
  return (
    <g opacity={0.33 * amount}>
      {spots.map(([phi, y, rx, ry], i) => {
        const p = g.pt(phi, y + ny);
        return p.z > 0 ? <ellipse key={i} cx={p.x} cy={p.y} rx={rx * Math.max(0.4, p.fs)} ry={ry} fill="#4a3528" transform={`rotate(${-12 + i * 9} ${p.x} ${p.y})`} /> : null;
      })}
      {(() => {
        const p = g.pt(0.58, -58 + ny);
        return p.z > 0 ? <path d={`M${p.x - 4} ${p.y - 3} l9 5`} stroke="#8c3b30" strokeWidth={1.4} opacity={0.9} /> : null;
      })()}
    </g>
  );
};

const Stubble: React.FC<{g: HeadGeo; design: Design}> = ({g, design}) => {
  const pts: P[] = [];
  for (const y of [-40, -30, -20, -10, -2]) pts.push([g.edge(y).r - 2, y]);
  for (const y of [-2, -10, -20, -30, -40]) pts.push([g.edge(y).l + 2, y]);
  return <path d={smoothPath(pts, true)} fill={design.hairShade} opacity={0.14} />;
};

const AgeLines: React.FC<{g: HeadGeo; design: Design; ny: number; pose: Pose}> = ({g, design, ny, pose}) => {
  const a = design.age;
  const nl = (side: number) => {
    const p0 = g.pt(side * 0.32, -42 + ny);
    const p1 = g.pt(side * 0.42, -22 + ny);
    if (p0.z < 0) return null;
    return <path key={side} d={`M${p0.x} ${p0.y} Q${p1.x + side * 3} ${p0.y + 8} ${p1.x} ${p1.y}`} fill="none" stroke={design.skinShade} strokeWidth={1.8} opacity={0.55 * a} strokeLinecap="round" />;
  };
  const fh = (yy: number, i: number) => {
    const l = g.pt(-0.4, yy + ny);
    const r = g.pt(0.4, yy + ny);
    return <path key={i} d={`M${l.x} ${l.y} Q${(l.x + r.x) / 2} ${yy + ny - 3 - pose.browWorry * 2} ${r.x} ${r.y}`} fill="none" stroke={design.skinShade} strokeWidth={1.3} opacity={0.45 * a} />;
  };
  return (
    <g>
      {nl(-1)}
      {nl(1)}
      {a > 0.5 ? [fh(-112, 0), fh(-120, 1)] : null}
    </g>
  );
};

const Glasses: React.FC<{eyes: {side: number; x: number; y: number; z: number; fs: number}[]; es: number; g: HeadGeo; ny: number}> = ({eyes, es, g, ny}) => {
  const vis = eyes.filter((e) => e.z > 0);
  const w = 25 * es;
  const h = 17 * es;
  const bridge = g.pt(0, -76 + ny);
  return (
    <g fill="none" stroke="#222" strokeWidth={2.4}>
      {vis.map((e) => {
        const sxx = Math.max(0.3, e.fs);
        return (
          <g key={e.side}>
            <rect x={e.x - w * sxx} y={e.y - h} width={w * 2 * sxx} height={h * 2} rx={7} fill="#cfe3ff" fillOpacity={0.12} />
            <path d={`M${e.x - w * sxx * 0.5} ${e.y - h * 0.6} l${w * sxx * 0.6} ${h * 0.9}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} />
          </g>
        );
      })}
      {vis.length === 2 ? <path d={`M${vis[0].x + w * Math.max(0.3, vis[0].fs)} ${bridge.y - 2} Q${bridge.x} ${bridge.y - 6} ${vis[1].x - w * Math.max(0.3, vis[1].fs)} ${bridge.y - 2}`} /> : null}
    </g>
  );
};

// ---------------- hair ----------------
type Tuft = {r: [number, number]; ry: number; t: [number, number]; bend: number; front?: boolean};

const STYLE_TUFTS: Record<string, {vol: number; hairline: number; tufts: Tuft[]; spikes: number}> = {
  gleb: {
    vol: 9,
    hairline: -126,
    spikes: 1,
    tufts: [
      {r: [-1.18, -0.82], ry: -136, t: [-1.2, -100], bend: -0.25},
      {r: [-0.92, -0.52], ry: -146, t: [-0.95, -104], bend: -0.3},
      {r: [-0.62, -0.2], ry: -152, t: [-0.62, -96], bend: -0.25},
      {r: [-0.3, 0.12], ry: -154, t: [-0.3, -90], bend: -0.2},
      {r: [-0.02, 0.36], ry: -154, t: [0.02, -94], bend: -0.25},
      {r: [0.24, 0.6], ry: -151, t: [0.36, -97], bend: -0.15},
      {r: [0.5, 0.88], ry: -146, t: [0.68, -104], bend: 0.1},
      {r: [0.82, 1.18], ry: -138, t: [1.05, -102], bend: 0.2},
      {r: [1.08, 1.5], ry: -128, t: [1.4, -82], bend: 0.15},
      {r: [-1.5, -1.08], ry: -128, t: [-1.42, -82], bend: -0.15},
    ],
  },
  side: {
    vol: 8,
    hairline: -128,
    spikes: 0,
    tufts: [
      {r: [-1.3, -0.6], ry: -148, t: [-1.32, -98], bend: -0.4},
      {r: [-0.7, 0.1], ry: -156, t: [-0.85, -104], bend: -0.5},
      {r: [-0.1, 0.6], ry: -154, t: [-0.45, -110], bend: -0.5},
      {r: [0.5, 1.1], ry: -148, t: [0.3, -118], bend: -0.4},
      {r: [1.0, 1.5], ry: -132, t: [1.38, -86], bend: 0.1},
    ],
  },
  neat: {
    vol: 6,
    hairline: -134,
    spikes: 0,
    tufts: [
      {r: [-1.2, -0.3], ry: -156, t: [-1.25, -122], bend: -0.3},
      {r: [-0.4, 0.7], ry: -160, t: [-0.6, -132], bend: -0.4},
      {r: [0.6, 1.4], ry: -150, t: [1.38, -100], bend: 0.2},
    ],
  },
  grey: {
    vol: 5,
    hairline: -140,
    spikes: 0,
    tufts: [
      {r: [0.7, 1.45], ry: -146, t: [1.4, -98], bend: 0.15},
      {r: [-1.45, -0.7], ry: -146, t: [-1.4, -98], bend: -0.15},
    ],
  },
  buzz: {vol: 3, hairline: -132, spikes: 0, tufts: []},
  curly: {vol: 13, hairline: -126, spikes: 0, tufts: []},
  long: {
    vol: 9,
    hairline: -128,
    spikes: 0,
    tufts: [
      {r: [-0.9, 0.05], ry: -156, t: [-1.1, -100], bend: -0.4},
      {r: [-0.05, 0.9], ry: -156, t: [1.1, -100], bend: 0.4},
    ],
  },
};

const HairBack: React.FC<{g: HeadGeo; design: Design; pose: Pose}> = ({g, design, pose}) => {
  const st = STYLE_TUFTS[design.hairStyle];
  const vol = st.vol + 2;
  const sb = Math.sin(g.b);
  const backSide = sb >= 0 ? -1 : 1;
  const ys = [-171, -162, -150, -140, -130, -120, -110, -100, -90];
  const right: P[] = [];
  const left: P[] = [];
  const longHair = design.hairStyle === 'long';
  for (const y of ys) {
    const e = g.edge(y, vol);
    right.push([e.r, y]);
    left.push([e.l, y]);
  }
  // nape on the back side
  const bottomY = longHair ? 60 : design.hairStyle === 'buzz' ? -70 : -58;
  const nape: P[] = [];
  const steps = longHair ? 8 : 4;
  const e0 = g.edge(-90, vol);
  const back = backSide > 0 ? e0.r : e0.l;
  const front = backSide > 0 ? g.edge(-90, 0).r - 30 : g.edge(-90, 0).l + 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = -90 + (bottomY + 90) * t;
    const ragged = i % 2 ? 6 : 0;
    nape.push([back + backSide * (longHair ? 14 * Math.sin(t * 3) : -t * 8) - backSide * ragged * 0.5, y + ragged]);
  }
  void front;
  const pts: P[] =
    backSide > 0
      ? [...left.slice().reverse(), ...right, ...nape, [g.edge(-60).cx, -62]]
      : [...right.slice().reverse(), ...left, ...nape, [g.edge(-60).cx, -62]];
  if (longHair) {
    // long hair falls behind both shoulders
    const lb = g.edge(-90, vol + 8);
    pts.push([lb.l - 10, 40], [lb.l - 4, 70], [lb.r + 4, 70], [lb.r + 10, 40]);
  }
  void pose;
  return <path d={smoothPath(pts, true, 0.8)} fill={design.hairShade} />;
};

const HairFront: React.FC<{g: HeadGeo; design: Design; pose: Pose; idp: string}> = ({g, design, pose, idp}) => {
  const st = STYLE_TUFTS[design.hairStyle];
  const vol = st.vol;
  const wind = pose.hairWind;
  // cap: silhouette above the hairline + hairline across forehead
  const capYs = [-171, -166, -160, -152, -144, -136, -128, -120, -112];
  const right: P[] = capYs.map((y) => [g.edge(y, vol).r, y]);
  const left: P[] = capYs.map((y) => [g.edge(y, vol).l, y]);
  const hl: P[] = [];
  for (let i = 0; i <= 10; i++) {
    const phi = 1.45 - (2.9 * i) / 10;
    const y = st.hairline + 16 * Math.abs(phi) ** 1.6 * 0.55;
    const p = g.pt(phi, y, 2);
    const e = g.edge(y, vol);
    if (p.z < 0) hl.push([phi * Math.sign(Math.sin(g.b) || 1) > 0 ? e.r : e.l, y]);
    else hl.push([p.x, y]);
  }
  hl.sort((a, b) => b[0] - a[0]);
  const capPts: P[] = [...left.slice().reverse(), ...right.slice(0, -1), ...hl.slice(0, 1).map((p): P => [right[right.length - 1][0], p[1]]), ...hl, [left[left.length - 1][0], hl[hl.length - 1][1]]];
  const cap = smoothPath(capPts, true, 0.6);

  const tufts = st.tufts
    .map((t, i) => {
      const r0 = g.pt(t.r[0], t.ry, vol);
      const r1 = g.pt(t.r[1], t.ry, vol);
      const tip = g.pt(t.t[0] + wind * 0.06, t.t[1], vol * 0.5);
      const zAvg = (r0.z + r1.z + tip.z) / 3;
      if (zAvg < -8) return null;
      const bend = t.bend * 22;
      const m0: P = [(r0.x + tip.x) / 2 + bend - 3, (r0.y + tip.y) / 2];
      const m1: P = [(r1.x + tip.x) / 2 + bend + 3, (r1.y + tip.y) / 2];
      const d = `M${r0.x} ${r0.y} Q${m0[0] - 4} ${m0[1]} ${tip.x} ${tip.y} Q${m1[0] + 4} ${m1[1] - 4} ${r1.x} ${r1.y} Z`;
      const strand = `M${(r0.x + r1.x) / 2} ${r0.y + 4} Q${(m0[0] + m1[0]) / 2} ${(m0[1] + m1[1]) / 2} ${tip.x + (r1.x - r0.x) * 0.1} ${tip.y - 6}`;
      return {d, strand, i, tip};
    })
    .filter(Boolean) as {d: string; strand: string; i: number; tip: {x: number; y: number}}[];

  const spikes: React.ReactNode[] = [];
  if (st.spikes) {
    const top = g.edge(-166, vol);
    const c = (top.l + top.r) / 2;
    spikes.push(
      <path key="s1" d={`M${c - 6} ${-170} Q${c + 4} ${-188} ${c + 18} ${-186} Q${c + 10} ${-178} ${c + 12} ${-168}Z`} fill={design.hair} />,
      <path key="s3" d={`M${top.r - 10} ${-150} Q${top.r + 10} ${-160} ${top.r + 14} ${-148} Q${top.r + 6} ${-142} ${top.r - 2} ${-132}Z`} fill={design.hair} />,
    );
  }

  const grad = `${idp}-hair`;
  const curly = design.hairStyle === 'curly';
  return (
    <g>
      <defs>
        <linearGradient id={grad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={design.hairLight} />
          <stop offset="0.45" stopColor={design.hair} />
          <stop offset="1" stopColor={design.hairShade} />
        </linearGradient>
      </defs>
      {/* hair shadow cast on forehead */}
      <g transform="translate(3 7)" opacity={0.45}>
        <path d={cap} fill={design.skinShade} />
        {tufts.map((t) => (
          <path key={t.i} d={t.d} fill={design.skinShade} />
        ))}
      </g>
      {spikes}
      <path d={cap} fill={`url(#${grad})`} />
      {curly
        ? capPts.filter((_, i) => i % 2 === 0).map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={9} fill={design.hair} />)
        : null}
      {tufts.map((t) => (
        <g key={t.i}>
          <path d={t.d} fill={design.hair} stroke={design.hairShade} strokeWidth={1.2} strokeLinejoin="round" />
          <path d={t.strand} fill="none" stroke={design.hairShade} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
      {/* highlight ring */}
      {design.hairStyle !== 'buzz' ? (
        <path
          d={smoothPath(
            [
              [g.pt(-0.9, -158, vol).x, -150],
              [g.pt(-0.3, -164, vol).x, -162],
              [g.pt(0.4, -162, vol).x, -160],
              [g.pt(0.9, -152, vol).x, -148],
            ],
            false,
          )}
          fill="none"
          stroke={design.hairLight}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.55}
          strokeDasharray="16 9"
        />
      ) : null}
    </g>
  );
};

const Helmet: React.FC<{g: HeadGeo; design: Design; pose: Pose; idp: string; light: Light}> = ({g, design, idp, light}) => {
  const c = design.colors.accent === '#6b7350' ? design.colors.accent : '#5f6847';
  const dark = mixHex(c, '#1d2014', 0.45);
  const lightC = mixHex(c, '#c9cfa8', 0.3);
  const e = g.edge(-128, 0);
  const cxh = (e.l + e.r) / 2 + Math.sin(g.b) * 4;
  const rx = (e.r - e.l) / 2 + 22;
  const brimY = -110;
  const dome = `M${cxh - rx} ${brimY} C${cxh - rx} ${-178} ${cxh - rx * 0.55} ${-200} ${cxh} ${-200} C${cxh + rx * 0.55} ${-200} ${cxh + rx} ${-178} ${cxh + rx} ${brimY} Q${cxh} ${brimY - 14} ${cxh - rx} ${brimY}Z`;
  const front = {x: cxh + Math.sin(g.b) * rx * 0.3};
  const brim = `M${cxh - rx - 4} ${brimY + 2} Q${cxh} ${brimY - 14} ${cxh + rx + 4} ${brimY + 2} L${cxh + rx + 3} ${brimY + 10} Q${cxh} ${brimY - 4} ${cxh - rx - 3} ${brimY + 10}Z`;
  const strap = (side: number) => {
    const ear = g.pt(side * 1.45, -100, 3);
    const jaw = g.pt(side * 1.3, -40, 2);
    const chin = g.pt(side * 0.75, 4, 1);
    if (ear.z < -40 || jaw.z < -30) return null;
    return <path key={side} d={`M${ear.x} ${ear.y} Q${jaw.x} ${jaw.y} ${chin.x} ${chin.y}`} fill="none" stroke="#2c2f22" strokeWidth={3.6} strokeLinecap="round" opacity={0.9} />;
  };
  const hlx = light.x >= 0 ? 1 : -1;
  // a few hair strands peeking under the brim
  const peeks = [-0.5, -0.15, 0.25].map((phi, i) => {
    const p = g.pt(phi, -112, 5);
    return p.z > 0 ? <path key={i} d={`M${p.x - 8} ${-114} Q${p.x - 4} ${-100} ${p.x - 10} ${-94} Q${p.x + 2} ${-102} ${p.x + 8} ${-114}Z`} fill={design.hair} stroke={design.hairShade} strokeWidth={1} /> : null;
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${idp}-hel`} cx={hlx > 0 ? 0.65 : 0.35} cy="0.2" r="0.85">
          <stop offset="0" stopColor={lightC} />
          <stop offset="0.5" stopColor={c} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <clipPath id={`${idp}-helc`}>
          <path d={dome} />
        </clipPath>
      </defs>
      <path d={`M${cxh - rx + 10} ${brimY + 4} Q${cxh} ${brimY + 26} ${cxh + rx - 10} ${brimY + 4} L${cxh + rx - 10} ${brimY - 4} L${cxh - rx + 10} ${brimY - 4}Z`} fill="#2a1d16" opacity={0.35} />
      {peeks}
      {strap(-1)}
      {strap(1)}
      <path d={dome} fill={`url(#${idp}-hel)`} stroke="#22261a" strokeWidth={2} />
      <g clipPath={`url(#${idp}-helc)`} opacity={0.35}>
        {[[-40, -170, 18], [10, -186, 14], [35, -150, 16], [-15, -140, 12], [50, -175, 10]].map(([x, y, r], i) => (
          <ellipse key={i} cx={front.x + x} cy={y} rx={r} ry={r * 0.6} fill={i % 2 ? dark : '#7b7f55'} transform={`rotate(${i * 30} ${front.x + x} ${y})`} />
        ))}
        {/* cover seams */}
        <path d={`M${front.x - 60} ${-150} Q${front.x} ${-175} ${front.x + 60} ${-150}`} stroke="#2b2f20" strokeWidth={1.5} fill="none" />
      </g>
      <path d={brim} fill={dark} stroke="#1f2218" strokeWidth={1.5} />
      <ellipse cx={front.x + hlx * 22} cy={-176} rx={20} ry={7} fill="#fff" opacity={0.1} transform={`rotate(${hlx * 18} ${front.x + hlx * 22} -176)`} />
    </g>
  );
};

const BackHairMass: React.FC<{g: HeadGeo; design: Design; helmet: boolean}> = ({g, design}) => {
  const vol = STYLE_TUFTS[design.hairStyle].vol;
  const ys = [-171, -162, -150, -135, -120, -105, -90, -75, -62];
  const r: P[] = ys.map((y) => [g.edge(y, vol).r, y]);
  const l: P[] = ys.map((y) => [g.edge(y, vol).l, y]);
  const c = g.edge(-50).cx;
  const pts: P[] = [...r, [c + 22, -50], [c + 10, -42], [c, -48], [c - 10, -42], [c - 22, -50], ...l.reverse()];
  return (
    <g>
      <path d={smoothPath(pts, true, 0.8)} fill={design.hair} stroke={design.hairShade} strokeWidth={1.5} />
      {[-30, -10, 10, 30].map((dx) => (
        <path key={dx} d={`M${c + dx * 0.6} -165 Q${c + dx} -110 ${c + dx * 0.8} -55`} stroke={design.hairShade} strokeWidth={2} fill="none" opacity={0.6} />
      ))}
    </g>
  );
};
