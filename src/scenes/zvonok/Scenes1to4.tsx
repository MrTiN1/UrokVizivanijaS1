// «Звонок от себя», scenes 1–4: the call, an ordinary evening, the warning,
// the knock and the peephole.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {ARTEM, ARTEM_WET} from '../../characters/designs';
import {Act, Post} from '../bus/common';
import {CallLogScreen, DialScreen, InCallScreen, IncomingScreen, ZPhone} from './world/ZPhone';
import {ChairFront, DeskClock, DoorClose, HALL_DOOR, HallwayBack, L_HALL, L_LAMP, L_MONITOR, PeepholeView, RoomBack} from './world/Home';
import {BOKEH_HALL, BOKEH_ROOM, ChannelTitle, Close, EAR_ARM, PhoneAtEar, PhoneGlow, artem} from './zcommon';
import {Bokeh, Glow} from '../../effects/Weather';
import {Flash} from '../../effects/Atmosphere';
import {exprTrack, lipSync} from '../../animation/performance';
import {walk} from '../../animation/cycles';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {EPISODE, ev, evArr} from '../../data';

const L_PHONE_FACE = {x: 0.1, y: 0.9, rim: '#a9c8ff', rimStrength: 0.8, shade: '#0d1020', shadeStrength: 0.65};

// ---------------------------------------------------------------- 1 hook
export const ZvHook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const ans = ev('z1_hook', 'answer');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 4.6 ? (
        <CameraRig cam={{x: 0, y: -30 * t, zoom: 1.05 + 0.04 * t, rot: fbm(f / 40, 2) * 0.6, shake: 0.6, shakeFreq: 0.5}}>
          <Layer depth={0.5}>
            <Bokeh discs={BOKEH_ROOM} top="#10131d" bottom="#050608" />
          </Layer>
          <Layer depth={1}>
            <ZPhone x={540} y={1000} scale={1.35} rot={-4} vibrate={t < ans ? 1 : 0}>
              <IncomingScreen time="23:58" t={t} accepted={ramp(t, ans - 0.1, ans + 0.2)} />
            </ZPhone>
            <Glow x={540} y={950} r={720} color="#8fb0ff" intensity={0.2} />
          </Layer>
        </CameraRig>
      ) : (
        <Answer f={f} t={t} />
      )}
      <Post warm={0.05} />
    </AbsoluteFill>
  );
};

const Answer: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 4.6;
  const raise = ease.out(clamp(lt / 0.6));
  const p = artem(f, {bodyTurn: 0.35, headTurn: 0.4, eyeX: -0.2, armL: EAR_ARM}, exprTrack(Math.round(lt * 30), [[0, 'doubt'], [50, 'anxiety', 30]]));
  const s = 2.8;
  const y = 960 + 436 * s - 30 * s;
  return (
    <>
      <Close p={p} s={s} light={L_PHONE_FACE} cam={{x: 0, y: -40 * raise, zoom: 1 + 0.05 * lt, rot: 0, shake: 0.7, shakeFreq: 0.5}} extra={raise > 0.5 ? <PhoneAtEar x={540} y={y} s={s} headTurn={0.4} /> : null} />
      <PhoneGlow amount={1 - raise * 0.5} />
    </>
  );
};

// ---------------------------------------------------------------- 2 evening
export const ZvEvening: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 2.4 ? (
        <AbsoluteFill>
          <AbsoluteFill style={{transform: `scale(${1.1 + t * 0.04})`}}>
            <Bokeh discs={BOKEH_ROOM} top="#10131d" bottom="#050608" />
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'rgba(4,6,10,0.55)'}} />
          <ChannelTitle t={t} out={ramp(t, 2.0, 2.4)} title={EPISODE.title} />
        </AbsoluteFill>
      ) : t < 6.6 ? (
        <RoomWide f={f} t={t} />
      ) : t < ev('z2_evening', 'phone') ? (
        <DeskSide f={f} t={t} />
      ) : (
        <CallLog f={f} t={t} />
      )}
      <Post warm={0.06} />
    </AbsoluteFill>
  );
};

/** The room: Artyom from behind at the desk, rain on the window, warm lamp. */
export const RoomWide: React.FC<{f: number; t: number; clock?: string; turn?: number; lamp?: number; extra?: React.ReactNode; zoom?: number}> = ({f, t, clock = '23:56', turn = 0, lamp = 1, extra, zoom}) => {
  const type = Math.sin(t * 9) * 0.5 + 0.5;
  const bt = lerp(3.7, 0.4, turn);
  const p = artem(f, {bodyTurn: bt, headTurn: lerp(3.6, 0.2, turn), legL: {hip: 84, knee: 88, foot: 0}, legR: {hip: 80, knee: 84, foot: 0}, armL: {shoulder: 42 + type * 3, elbow: 44, wrist: 0, hand: 'type'}, armR: {shoulder: 44 - type * 3, elbow: 42, wrist: 0, hand: 'type'}}, 'neutral', 1, 31);
  const z = zoom ?? 1.02 + 0.015 * t;
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: z, rot: fbm(f / 60, 3) * 0.3, shake: 0.4, shakeFreq: 0.4}}>
      <Layer depth={1}>
        <RoomBack t={t} clock={clock} lamp={lamp} />
        <Act d={ARTEM} p={p} x={430} y={1330} s={0.95} id="z2w" light={L_MONITOR} />
        <ChairFront x={430} y={1340} s={0.95} back={turn < 0.5} />
        {extra}
      </Layer>
    </CameraRig>
  );
};

/** Side close-up at the desk, monitor light on the face. */
const DeskSide: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 6.6;
  const p = artem(f, {bodyTurn: 0.75, headTurn: 0.8, eyeX: 0.4, headNod: 0.08}, 'interest', 0.6);
  return <Close p={p} x={420} s={2.6} light={L_MONITOR} discs={BOKEH_ROOM} cam={{x: 0, y: 0, zoom: 1 + 0.02 * lt, rot: 0, shake: 0.5, shakeFreq: 0.4}} extra={<Glow x={1080} y={900} r={700} color="#7fa8ff" intensity={0.3} />} />;
};

const CallLog: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev('z2_evening', 'phone');
  return (
    <CameraRig cam={{x: 0, y: -60 * ease.cam(clamp(lt / 4)), zoom: 1.0 + 0.12 * ease.cam(clamp(lt / 4)), rot: 0, shake: 0.5, shakeFreq: 0.5}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_ROOM} top="#10131d" bottom="#050608" />
      </Layer>
      <Layer depth={1}>
        <ZPhone x={540} y={1020} scale={1.4} rot={3 + fbm(f / 40, 1)}>
          <CallLogScreen time="23:58" highlight={ramp(lt, 1.2, 1.8)} />
        </ZPhone>
      </Layer>
    </CameraRig>
  );
};

// ---------------------------------------------------------------- 3 warning
export const ZvWarning: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const S = 'z3_warning';
  const voice = ev(S, 'voice');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < voice ? (
        <CameraRig cam={{x: 0, y: 0, zoom: 1.04 + 0.01 * t, rot: fbm(f / 40, 2) * 0.5, shake: 0.6, shakeFreq: 0.5}}>
          <Layer depth={0.5}>
            <Bokeh discs={BOKEH_ROOM} top="#10131d" bottom="#050608" />
          </Layer>
          <Layer depth={1}>
            <ZPhone x={540} y={1000} scale={1.4} rot={-3}>
              <DialScreen time="23:58" t={t} error={ramp(t, ev(S, 'error'), ev(S, 'error') + 0.3)} />
            </ZPhone>
          </Layer>
        </CameraRig>
      ) : t < ev(S, 'clock') ? (
        <VoiceBack f={f} t={t} />
      ) : t < ev(S, 'noise') ? (
        <DeskClock time="23:59" blink />
      ) : (
        <Noise f={f} t={t} />
      )}
      <Post warm={0.05} />
    </AbsoluteFill>
  );
};

const VoiceBack: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 6.8;
  const p = artem(f, {bodyTurn: 0.1, headTurn: 0.05, eyeY: 0.5, headNod: 0.25, armR: {shoulder: 40, elbow: 90, wrist: 0, hand: 'hold'}}, exprTrack(Math.round(lt * 30), [[0, 'confusion'], [20, 'fear', 20]]));
  return (
    <>
      <Close p={{...p, pupil: lerp(1, 0.75, clamp(lt / 1.2))}} s={2.8} light={L_PHONE_FACE} cam={{x: 0, y: 0, zoom: 1 + 0.05 * lt, rot: 0, shake: 0.6, shakeFreq: 0.5}} />
      <PhoneGlow />
    </>
  );
};

const Noise: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 12.4;
  const turn = ease.inOut(clamp((lt - 0.3) / 0.9));
  const p = artem(f, {bodyTurn: lerp(0.2, -0.6, turn), headTurn: lerp(0.1, -0.95, turn), eyeX: -0.6}, 'anxiety');
  return <Close p={p} s={2.6} x={600} cam={{x: 0, y: 0, zoom: 1.02, rot: 0, shake: 0.7, shakeFreq: 0.5}} extra={<Glow x={0} y={900} r={600} color="#ffcf8a" intensity={0.18} />} />;
};

// ---------------------------------------------------------------- 4 knock
export const ZvKnock: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const S = 'z4_knock';
  const knocks = evArr(S, 'knocks');
  const hit = knocks.reduce((a, k) => Math.max(a, Math.max(0, 1 - Math.abs(t - k) / 0.15)), 0);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 1.8 ? (
        <DeskClock time="00:00" />
      ) : t < ev(S, 'walk') ? (
        <CameraRig cam={{x: 0, y: 0, zoom: 1.0 + 0.02 * (t - 1.8), rot: 0, shake: hit * 6, shakeFreq: 1}}>
          <Layer depth={1}>
            <HallwayBack doorGlow={hit} />
          </Layer>
        </CameraRig>
      ) : t < ev(S, 'peep') ? (
        <HallWalk f={f} t={t} />
      ) : t < ev(S, 'back') ? (
        <Peep f={f} t={t} />
      ) : (
        <StepBack f={f} t={t} />
      )}
      <Flash amount={hit * 0.06} color="#ffd29a" />
      <Post warm={0.05} />
    </AbsoluteFill>
  );
};

/** Hallway: Artyom walks from camera towards the front door (back view). */
const HallWalk: React.FC<{f: number; t: number}> = ({f, t}) => {
  const k = ease.inOut(clamp((t - 4.4) / 2.4));
  const cyc = walk((t - 4.4) * 0.7, k < 1 ? 0.6 : 0);
  const p = artem(f, {bodyTurn: 3.7, headTurn: 3.7, lean: cyc.lean, legL: cyc.legL, legR: cyc.legR, armL: cyc.armL, armR: cyc.armR}, 'anxiety');
  const s = lerp(1.25, 0.62, k);
  const y = lerp(2050, HALL_DOOR.y + HALL_DOOR.h + 60, k) - 430 * s;
  return (
    <CameraRig cam={{x: 0, y: -40 * k, zoom: 1.02 + 0.08 * k, rot: fbm(f / 40, 1) * 0.4, shake: 0.8, shakeFreq: 0.5}}>
      <Layer depth={1}>
        <HallwayBack />
        <Act d={ARTEM} p={p} x={540} y={y} s={s} id="z4h" light={L_HALL} />
      </Layer>
    </CameraRig>
  );
};

const Peep: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 7.0;
  const ls = lipSync('z4_knock', 'z4_d1', f);
  // first a beat of Artyom leaning to the peephole, then the fisheye view
  if (lt < 1.2) {
    const lean = ease.inOut(clamp(lt / 1.0));
    const p = artem(f, {bodyTurn: 1.0, headTurn: 1.0, eyeX: 0.6, headNod: 0.05, lean: 6 * lean}, 'fear', 0.8);
    return (
      <CameraRig cam={{x: 0, y: 0, zoom: 1.05, rot: 0, shake: 0.6, shakeFreq: 0.5}}>
        <Layer depth={1}>
          <DoorClose />
          <Act d={ARTEM} p={p} x={lerp(80, 170, lean)} y={560 + 436 * 3.0 - 70 * 3.0} s={3.0} id="z4d" light={L_HALL} legs={false} />
        </Layer>
      </CameraRig>
    );
  }
  const up = ease.inOut(clamp((lt - 1.4) / 0.8));
  let p = artem(f, {bodyTurn: 0.0, headTurn: 0.0, headNod: lerp(0.4, 0.02, up), eyeY: lerp(0.6, 0, up)}, 'tired', 0.9, 77);
  p = {...p, blink: lt > 2.2 ? 0 : p.blink, lidDrop: 0.32, sweat: 0.8};
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1 + 0.03 * lt, rot: fbm(f / 30, 4) * 0.8, shake: 0.6, shakeFreq: 0.4}}>
      <Layer depth={1}>
        <PeepholeView t={t} figure={{d: ARTEM_WET, p, mouth: ls.talking ? ls.mouth : undefined}} />
      </Layer>
    </CameraRig>
  );
};

const StepBack: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 12.4;
  const back = ease.out(clamp(lt / 1.6));
  const cyc = walk(-lt * 1.0, (1 - back) * 0.8);
  const p = artem(f, {bodyTurn: -0.1, headTurn: -0.1, lean: -5, legL: cyc.legL, legR: cyc.legR, armL: {shoulder: 22, elbow: 46, wrist: 0, hand: 'open'}, armR: {shoulder: 18, elbow: 42, wrist: 0, hand: 'open'}}, 'shock');
  return <Close p={{...p, pupil: 0.62}} s={lerp(3.0, 2.3, back)} discs={BOKEH_HALL} light={L_HALL} top="#1a1620" bottom="#08070a" cam={{x: 0, y: 0, zoom: 1, rot: 0, shake: 1.8 * (1 - back) + 0.5, shakeFreq: 0.7}} />;
};

void L_LAMP;
