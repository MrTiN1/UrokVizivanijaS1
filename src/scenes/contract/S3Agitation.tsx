// Scene 3 — agitation: assembly hall, representative at the podium with the
// "КОНТРАКТНАЯ СЛУЖБА / БЕСПИЛОТНЫЕ СИСТЕМЫ" slide; Gleb listens (rack focus).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer, Svg} from '../../camera/Camera';
import {AudienceHead, HallBackdrop, Podium, Slide} from './backgrounds/Interior';
import {Dust, Grade, Grain, LightRays, Vignette} from '../../effects/Atmosphere';
import {Character} from '../../characters/Character';
import {CLASSMATE, GLEB_CIVIL, REPRESENTATIVE, STUDENTS} from '../../characters/designs';
import {Light, Pose} from '../../characters/types';
import {alive, exprTrack, lipSync, pose, withExpr} from '../../animation/performance';
import {clamp, ease, fbm, ramp} from '../../animation/core';
import {VISEME_PARAMS} from '../../characters/Head';

const S = 's3_agitation';
export const LIGHT_HALL: Light = {x: 0.35, y: -0.8, rim: '#ffe9c4', rimStrength: 0.5, shade: '#3f3640', shadeStrength: 0.45};
const LIGHT_AUD: Light = {x: -0.6, y: -0.3, rim: '#d7e6ff', rimStrength: 0.5, shade: '#3a3442', shadeStrength: 0.45};

const AUD = [
  {x: 80, hair: '#3a2a20', top: '#5a3b36'},
  {x: 300, hair: '#8a6540', top: '#2f3d55'},
  {x: 520, hair: '#1f1a16', top: '#6b5a7d'},
  {x: 760, hair: '#c49a63', top: '#3f5a52'},
  {x: 990, hair: '#4a3a2c', top: '#7a3b36'},
];

const repPose = (f: number, t: number, speaking: boolean): Pose => {
  const ls = lipSync(S, 's3_r1', f);
  // gestures: open palm toward screen on key words, beat gestures otherwise
  const g1 = ramp(t, 1.5, 2.0, ease.back) * (1 - ramp(t, 3.2, 3.7));
  const g2 = ramp(t, 4.0, 4.5, ease.back) * (1 - ramp(t, 6.4, 7.0));
  const g3 = ramp(t, 8.5, 9.0, ease.back) * (1 - ramp(t, 10.6, 11.2));
  const beat = speaking ? Math.max(0, Math.sin(t * 7)) * 6 : 0;
  let p = pose({
    bodyTurn: -0.35 + g2 * -0.2,
    headTurn: -0.25 + g2 * -0.45 + fbm(t, 3) * 0.1,
    eyeX: -0.2 - g2 * 0.5,
    armR: {shoulder: 20 + g1 * 50 + beat, elbow: 60 - g1 * 30, wrist: -10, hand: g1 > 0.3 ? 'open' : 'relaxed'},
    armL: {shoulder: 10 + g2 * 95 + g3 * 80, elbow: 20 - g2 * 10, wrist: 0, hand: g2 + g3 > 0.3 ? 'open' : 'relaxed'},
  });
  p = withExpr(p, 'neutral');
  p.smile = 0.2;
  p.browL = 0.15;
  p = alive(p, f, {seed: 31, headMotion: 1.4});
  return {...p, mouth: 'X', jaw: 0, ...(ls.talking ? {} : {})};
};

export const S3Agitation: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const shot = t < 7.5 ? 0 : t < 12 ? 1 : 2;
  const ls = lipSync(S, 's3_r1', f);
  const reveal = clamp((t - 1.6) / 4.2);
  const slide = <Slide reveal={reveal} />;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shot === 0 && <Wide f={f} t={t} slide={slide} mouth={ls.mouth} />}
      {shot === 1 && <RepMedium f={f} t={t} slide={slide} />}
      {shot === 2 && <Listener f={f} t={t} slide={slide} />}
      <Grade shadow="#2b2a33" highlight="#ffe3b0" shadowOp={0.25} highlightOp={0.05} />
      <Vignette strength={0.55} />
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};

const Wide: React.FC<{f: number; t: number; slide: React.ReactNode; mouth: typeof VISEME_PARAMS.X}> = ({f, t, slide, mouth}) => {
  const k = ease.cam(clamp(t / 7.5));
  const cam = {x: 0, y: -20 * k, zoom: 1.0 + 0.12 * k, rot: 0, shake: 0};
  const p = repPose(f, t, true);
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.7}>
        <HallBackdrop slide={slide} />
        <LightRays origin={[540, -120]} angle={90} count={3} length={1300} spread={30} opacity={0.18} color="#fff1d6" />
      </Layer>
      <Layer depth={0.8}>
        <Svg>
          <Character design={REPRESENTATIVE} pose={p} mouth={mouth} light={LIGHT_HALL} x={985} y={760} scale={0.68} idp="rep0" legs />
          <Podium x={140} y={790} />
        </Svg>
      </Layer>
      <Layer depth={1}>
        <Svg>
          {AUD.map((a, i) => (
            <AudienceHead key={i} x={a.x + 40} y={1330} s={0.85} hair={a.hair} top={a.top} seed={i + 1} />
          ))}
        </Svg>
      </Layer>
      <Layer depth={1.2}>
        <Svg>
          {AUD.map((a, i) => (
            <AudienceHead key={i} x={a.x - 60} y={1600} s={1.2} hair={AUD[(i + 2) % 5].hair} top={AUD[(i + 3) % 5].top} seed={i + 9} />
          ))}
        </Svg>
      </Layer>
      <Layer depth={1.45} blur={6}>
        <Svg>
          {[120, 540, 960].map((x, i) => (
            <AudienceHead key={i} x={x} y={1900} s={1.7} hair={AUD[i].hair} top="#1c1c22" seed={i + 20} />
          ))}
        </Svg>
      </Layer>
      <Dust count={30} color="#fff1d6" opacity={0.4} size={2} seed={5} area={[0, 0, 1080, 1100]} speed={0.4} />
    </CameraRig>
  );
};

const RepMedium: React.FC<{f: number; t: number; slide: React.ReactNode}> = ({f, t, slide}) => {
  const lt = t - 7.5;
  const cam = {x: 10 * lt, y: 0, zoom: 1.0 + 0.03 * lt, rot: 0, shake: 0};
  const p = repPose(f, t, false);
  // silent "still talking" under the voice-over
  const v = (['C', 'B', 'X', 'D', 'B', 'E', 'X', 'C'] as const)[Math.floor(f / 4) % 8];
  p.mouth = v;
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.6} blur={3}>
        <div style={{position: 'absolute', inset: 0, transform: 'scale(1.8) translate(-60px, 140px)', transformOrigin: '540px 500px'}}>
          <HallBackdrop slide={slide} id="hb2" />
        </div>
      </Layer>
      <Layer depth={1}>
        <Svg>
          <Character design={REPRESENTATIVE} pose={p} light={LIGHT_HALL} x={600} y={2050} scale={1.7} idp="rep1" legs={false} />
        </Svg>
      </Layer>
      <Layer depth={1.4} blur={8}>
        <Svg>
          <AudienceHead x={150} y={1950} s={2.0} hair="#2a221c" top="#202027" seed={3} />
          <AudienceHead x={950} y={2000} s={2.1} hair="#8a6540" top="#29303a" seed={4} />
        </Svg>
      </Layer>
    </CameraRig>
  );
};

const Listener: React.FC<{f: number; t: number; slide: React.ReactNode}> = ({f, t, slide}) => {
  const lt = t - 12;
  const focus = ramp(lt, 0.4, 1.3, ease.inOut);
  const cam = {x: 0, y: 0, zoom: 1 + 0.08 * ease.cam(clamp(lt / 8)), rot: 0, shake: 0};
  const lf = Math.round(lt * 30);
  const e = exprTrack(lf, [
    [0, 'neutral'],
    [30, 'interest', 20],
    [Math.round(4.6 * 30), 'interest', 10],
  ]);
  const lean = ramp(lt, 3.0, 4.5, ease.inOut);
  let g = pose({bodyTurn: -0.35, headTurn: -0.32, eyeX: -0.25, eyeY: -0.15, lean: -4 * lean, headNod: -0.1});
  g = withExpr(g, e);
  if (lt > 4.6) {
    g.pupil = 1.2;
    g.browL = 0.65;
    g.browR = 0.45;
    g.smile = 0.15;
  }
  g = alive(g, f, {seed: 14, saccadeAmp: 0.05, blinkExtra: [Math.round(4.5 * 30) + f - lf]});
  const neighbours = (seed: number, d: (typeof STUDENTS)[number], x: number, turn: number) => {
    let p = pose({bodyTurn: turn, headTurn: turn, eyeX: -0.3});
    p = alive(p, f, {seed});
    return <Character design={d} pose={p} light={LIGHT_AUD} x={x} y={2050} scale={1.25} idp={`nb${seed}`} legs={false} />;
  };
  return (
    <CameraRig cam={cam}>
      <Layer depth={0.5} blur={2 + focus * 10}>
        <div style={{position: 'absolute', inset: 0, transform: 'scale(1.4) translate(120px, -40px)', transformOrigin: '540px 400px'}}>
          <HallBackdrop slide={slide} id="hb3" />
        </div>
      </Layer>
      <Layer depth={0.75} blur={4 + focus * 6}>
        <Svg>
          {neighbours(41, STUDENTS[2], 130, -0.3)}
          {neighbours(42, CLASSMATE, 980, -0.45)}
        </Svg>
      </Layer>
      <Layer depth={1} blur={(1 - focus) * 9}>
        <Svg>
          <Character design={GLEB_CIVIL} pose={g} light={LIGHT_AUD} x={560} y={1980} scale={2.5} idp="g3" legs={false} />
        </Svg>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 40% at 15% 30%, rgba(210,225,255,0.18), transparent 70%)', mixBlendMode: 'screen'}} />
      </Layer>
    </CameraRig>
  );
};
