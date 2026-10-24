// Assembled character: draw order handles depth (far limbs behind torso),
// a per-scene lighting filter adds soft form shadow + coloured rim light.
import React from 'react';
import {Design, Light, Pose} from './types';
import {Head, MouthParams, TURN_MAX} from './Head';
import {ArmView, LegView, Neck, Torso, makeBodyGeo} from './Body';
import {mixHex} from './Head';

export type CharacterProps = {
  design: Design;
  pose: Pose;
  light: Light;
  x: number;
  y: number;
  scale: number;
  idp: string;
  mouth?: MouthParams;
  legs?: boolean;
  shadow?: boolean; // contact shadow on the floor
  opacity?: number;
  headScale?: number;
};

export const LightFilter: React.FC<{id: string; light: Light}> = ({id, light}) => {
  const lx = Math.max(-1, Math.min(1, light.x));
  const ly = light.y;
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feOffset in="SourceAlpha" dx={-lx * 7} dy={-ly * 5} result="offR" />
      <feComposite in="SourceAlpha" in2="offR" operator="out" result="rimMask" />
      <feGaussianBlur in="rimMask" stdDeviation="1.4" result="rimBlur" />
      <feFlood floodColor={light.rim} floodOpacity={light.rimStrength} />
      <feComposite in2="rimBlur" operator="in" result="rim" />
      <feOffset in="SourceAlpha" dx={lx * 46} dy={ly * 30 + 14} result="offS" />
      <feComposite in="SourceAlpha" in2="offS" operator="out" result="shMask" />
      <feGaussianBlur in="shMask" stdDeviation="16" result="shBlur" />
      <feFlood floodColor={light.shade} floodOpacity={light.shadeStrength} />
      <feComposite in2="shBlur" operator="in" result="shCol" />
      <feBlend in="shCol" in2="SourceGraphic" mode="multiply" result="lit" />
      <feComposite in="lit" in2="SourceAlpha" operator="in" result="litIn" />
      <feBlend in="rim" in2="litIn" mode="screen" result="withRim" />
      <feComposite in="withRim" in2="SourceAlpha" operator="in" />
    </filter>
  );
};

export const Character: React.FC<CharacterProps> = ({
  design,
  pose,
  light,
  x,
  y,
  scale,
  idp,
  mouth,
  legs = true,
  shadow = false,
  opacity = 1,
  headScale = 1,
}) => {
  const bg = makeBodyGeo(design, pose);
  const h = design.height;
  // which arm/leg is far from camera
  const farSide = pose.bodyTurn >= 0 ? 1 : -1; // character's left (screen right in front view) is far when turned right
  const arms = [
    {side: -1, arm: pose.armR},
    {side: 1, arm: pose.armL},
  ];
  const legsArr = [
    {side: -1, leg: pose.legR},
    {side: 1, leg: pose.legL},
  ];
  const hb = pose.headTurn * TURN_MAX;
  const headX = bg.neck[0] + Math.sin(hb) * 5;
  const headY = bg.neck[1] + 4;
  const nearArm = arms.find((a) => a.side !== farSide)!;
  const farArm = arms.find((a) => a.side === farSide)!;
  const ambient = light.ambient;
  const filt = `${idp}-lf`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * h})`} opacity={opacity}>
      <defs>
        <LightFilter id={filt} light={light} />
      </defs>
      {shadow ? <ellipse cx={0} cy={430} rx={120} ry={18} fill="#000" opacity={0.35} /> : null}
      <g filter={`url(#${filt})`}>
        {/* lean pivots around the pelvis */}
        <g>
          {legs
            ? legsArr
                .slice()
                .sort((a) => (a.side === farSide ? -1 : 1))
                .map((l) => <LegView key={l.side} design={design} bg={bg} side={l.side} leg={l.leg} far={l.side === farSide} />)
            : null}
          <g transform={`rotate(${pose.lean} 0 0)`}>
            <ArmView design={design} bg={bg} side={farArm.side} arm={farArm.arm} far />
            {design.outfit === 'gleb_civil' ? <Backpack bg={bg} design={design} /> : null}
            <Neck design={design} bg={bg} headX={headX} />
            <Torso design={design} pose={pose} bg={bg} idp={idp} light={light} />
            {design.outfit === 'gleb_civil' && Math.cos(bg.b) < 0 ? <Backpack bg={bg} design={design} back /> : null}
            <g transform={`translate(${headX} ${headY}) rotate(${pose.headTilt + pose.headNod * 4 * bg.facing} 0 -70) scale(${headScale})`}>
              <Head design={design} pose={pose} light={light} mouth={mouth} idp={idp} />
            </g>
            <ArmView design={design} bg={bg} side={nearArm.side} arm={nearArm.arm} far={false} />
          </g>
        </g>
      </g>
      {ambient ? null : null}
    </g>
  );
};

const Backpack: React.FC<{bg: ReturnType<typeof makeBodyGeo>; design: Design; back?: boolean}> = ({bg, design, back: full}) => {
  if (full) {
    const c = design.colors.accent;
    return (
      <g>
        <rect x={-62} y={-318} width={124} height={210} rx={34} fill={c} stroke="#121316" strokeWidth={2.5} />
        <rect x={-46} y={-200} width={92} height={70} rx={16} fill={mixHex(c, '#000', 0.25)} stroke="#121316" strokeWidth={2} />
        <path d="M-50 -280 Q0 -296 50 -280" stroke={mixHex(c, '#000', 0.4)} strokeWidth={3} fill="none" />
      </g>
    );
  }
  // visible as a sliver behind the back side of the torso
  const back = -bg.facing;
  const e = bg.edge(-220, 0);
  const x = back > 0 ? e.r : e.l;
  const c = design.colors.accent;
  return (
    <g>
      <path
        d={`M${x - back * 30} ${-320} Q${x + back * 34} ${-322} ${x + back * 40} ${-260} L${x + back * 42} ${-110} Q${x + back * 38} ${-90} ${x - back * 30} ${-92}Z`}
        fill={c}
        stroke="#121316"
        strokeWidth={2}
      />
      <path d={`M${x + back * 10} ${-300} L${x + back * 30} ${-150}`} stroke={mixHex(c, '#000', 0.4)} strokeWidth={3} />
    </g>
  );
};
