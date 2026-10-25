// «Звонок от себя», scenes 5–8: whom to trust (banner window), the second
// call, the home-camera recording, the finale.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraRig, Layer} from '../../camera/Camera';
import {ARTEM} from '../../characters/designs';
import {Act, Post} from '../bus/common';
import {CameraScreen, InCallScreen, IncomingScreen, ZPhone} from './world/ZPhone';
import {DoorClose, HALL_DOOR, HallwayBack, L_HALL, L_MONITOR} from './world/Home';
import {BOKEH_HALL, BOKEH_ROOM, Close, EAR_ARM, PhoneAtEar, PhoneGlow, artem} from './zcommon';
import {RoomWide} from './Scenes1to4';
import {Bokeh, Glow} from '../../effects/Weather';
import {exprTrack, lipSync} from '../../animation/performance';
import {clamp, ease, fbm, lerp, ramp} from '../../animation/core';
import {EPISODE, ev} from '../../data';

const L_PHONE_FACE = {x: 0.1, y: 0.9, rim: '#a9c8ff', rimStrength: 0.8, shade: '#0d1020', shadeStrength: 0.65};
const L_COLD = {x: 0.2, y: -0.6, rim: '#bcd6ff', rimStrength: 0.5, shade: '#0c1020', shadeStrength: 0.7};

// ---------------------------------------------------------------- 5 whom to trust
export const ZvChoice: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 2 ? <WallPress f={f} t={t} /> : t < 9.2 ? <HallWide f={f} t={t} /> : <Torn f={f} t={t} />}
      <Post warm={0.05} />
    </AbsoluteFill>
  );
};

const WallPress: React.FC<{f: number; t: number}> = ({f, t}) => {
  const p = artem(f, {bodyTurn: 0.2, headTurn: lerp(0.2, -0.5, ease.inOut(clamp(t / 1.2))), eyeX: -0.5, shoulderUp: 0.35, lean: -3}, 'fear');
  return <Close p={{...p, breathe: (Math.sin(t * 5) + 1) / 2}} s={2.7} discs={BOKEH_HALL} light={L_HALL} top="#1a1620" bottom="#08070a" cam={{x: 0, y: 0, zoom: 1.02, rot: 0, shake: 0.8, shakeFreq: 0.6}} />;
};

/** Banner window 0:55–1:02.2: Artyom framed high in the hallway (face above y≈700), the door far behind. */
const HallWide: React.FC<{f: number; t: number}> = ({f, t}) => {
  const look = Math.sin((t - 2) * 0.8);
  const p = artem(f, {bodyTurn: 0.15, headTurn: 0.1 + 0.5 * look, eyeX: 0.4 * look, shoulderUp: 0.2 + 0.08 * Math.sin(t * 4.5), armR: {shoulder: 30, elbow: 80, wrist: 0, hand: 'hold'}}, 'anxiety');
  const s = 1.25;
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1.0, rot: fbm(f / 50, 2) * 0.3, shake: 0.5, shakeFreq: 0.4}}>
      <Layer depth={1}>
        <HallwayBack />
        <Act d={ARTEM} p={{...p, breathe: (Math.sin(t * 4.5) + 1) / 2}} x={760} y={680 + 436 * s - 220} s={s} id="z5w" light={L_HALL} />
      </Layer>
    </CameraRig>
  );
};

const Torn: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 9.2;
  const toPhone = lt > 2.8;
  const p = artem(
    f,
    {bodyTurn: 0.2, headTurn: toPhone ? 0.1 : -0.8 + 0.1 * Math.sin(lt * 2), headNod: toPhone ? 0.35 : 0, eyeX: toPhone ? 0 : -0.7, eyeY: toPhone ? 0.6 : 0, armR: {shoulder: 40, elbow: 90, wrist: 0, hand: 'hold'}},
    'anxiety',
  );
  return (
    <>
      <Close p={p} s={2.7} light={toPhone ? L_PHONE_FACE : L_HALL} discs={BOKEH_HALL} top="#1a1620" bottom="#08070a" cam={{x: 0, y: 0, zoom: 1 + 0.02 * lt, rot: 0, shake: 0.7, shakeFreq: 0.5}} />
      {toPhone ? <PhoneGlow /> : null}
    </>
  );
};

// ---------------------------------------------------------------- 6 second call
export const ZvCall2: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const S = 'z6_call2';
  const ans = ev(S, 'answer');
  const a1 = lipSync(S, 'z6_a1', f);
  const a2 = lipSync(S, 'z6_a2', f);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 2.2 ? (
        <CameraRig cam={{x: 0, y: 0, zoom: 1.05 + 0.03 * t, rot: fbm(f / 40, 2) * 0.6, shake: 0.6, shakeFreq: 0.5}}>
          <Layer depth={0.5}>
            <Bokeh discs={BOKEH_HALL} top="#120f16" bottom="#050406" />
          </Layer>
          <Layer depth={1}>
            <ZPhone x={540} y={1000} scale={1.35} rot={4} vibrate={t < ans ? 1 : 0}>
              <IncomingScreen time="00:02" t={t} accepted={ramp(t, ans - 0.1, ans + 0.2)} />
            </ZPhone>
          </Layer>
        </CameraRig>
      ) : t < 12.6 ? (
        <Talk f={f} t={t} mouth={a1.talking ? a1.mouth : a2.talking ? a2.mouth : undefined} />
      ) : (
        <Silence f={f} t={t} />
      )}
      <Post warm={0.05} />
    </AbsoluteFill>
  );
};

const Talk: React.FC<{f: number; t: number; mouth?: ReturnType<typeof lipSync>['mouth']}> = ({f, t, mouth}) => {
  const lt = t - 2.2;
  const e = exprTrack(Math.round(lt * 30), [
    [0, 'anxiety'],
    [80, 'fear', 14],
    [150, 'confusion', 20],
    [260, 'fear', 20],
  ]);
  const p = artem(f, {bodyTurn: 0.35, headTurn: 0.35, eyeX: -0.3, armL: EAR_ARM, lean: t > 4.9 && t < 6.8 ? -3 : 0}, e);
  return <Close p={p} s={2.8} mouth={mouth} extra={<PhoneAtEar x={540} y={960 + 436 * 2.8 - 30 * 2.8} s={2.8} headTurn={0.35} />} light={L_HALL} discs={BOKEH_HALL} top="#1a1620" bottom="#08070a" cam={{x: 0, y: 0, zoom: 1 + 0.015 * lt, rot: 0, shake: t > 4.9 && t < 6.8 ? 1.4 : 0.7, shakeFreq: 0.6}} />;
};

const Silence: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - 12.6;
  return (
    <CameraRig cam={{x: 0, y: -60 * ease.cam(clamp(lt / 4)), zoom: 1.0 + 0.15 * ease.cam(clamp(lt / 4)), rot: 0, shake: 0.5, shakeFreq: 0.4}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_HALL} top="#120f16" bottom="#050406" />
      </Layer>
      <Layer depth={1}>
        <ZPhone x={540} y={1000} scale={1.35} rot={-2 + fbm(f / 40, 3)}>
          <InCallScreen time="00:02" seconds={lt + 10.6} silent />
        </ZPhone>
      </Layer>
    </CameraRig>
  );
};

// ---------------------------------------------------------------- 7 camera recording
export const ZvCamera: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const S = 'z7_camera';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < ev(S, 'push') ? <CamApp f={f} t={t} /> : <TurnAround f={f} t={t} />}
      <Post warm={0.04} />
    </AbsoluteFill>
  );
};

const CamApp: React.FC<{f: number; t: number}> = ({f, t}) => {
  const S = 'z7_camera';
  const clip = t < ev(S, 'rec2') ? 'hall' : 'room';
  const ct = clip === 'hall' ? t - ev(S, 'rec1') : t - ev(S, 'rec2');
  const stamp = clip === 'hall' ? `25.10  23:54:${String(10 + Math.floor(Math.max(0, ct))).padStart(2, '0')}` : `25.10  23:58:${String(2 + Math.floor(Math.max(0, ct))).padStart(2, '0')}`;
  const push = clip === 'room' ? ease.cam(clamp((t - 7.2) / 4.5)) : 0;
  const on = ramp(t, ev(S, 'screenOn'), ev(S, 'screenOn') + 0.3);
  return (
    <CameraRig cam={{x: 0, y: -220 * push, zoom: 1.0 + 0.5 * push, rot: fbm(f / 40, 2) * 0.4, shake: 0.5, shakeFreq: 0.5}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_ROOM} top="#10131d" bottom="#050608" />
      </Layer>
      <Layer depth={1}>
        <ZPhone x={540} y={1020} scale={1.4} rot={-2} screen={on}>
          {t < ev(S, 'rec1') ? <rect width={400} height={860} fill="#0d1322" /> : <CameraScreen time="00:03" clip={clip as 'hall'} t={Math.max(0, ct)} stamp={stamp} />}
        </ZPhone>
        <Glow x={540} y={950} r={700} color="#8fb0ff" intensity={0.18 * on} />
      </Layer>
    </CameraRig>
  );
};

/** Artyom slowly turns around — the room behind him. */
const TurnAround: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev('z7_camera', 'push');
  const turn = ease.inOut(clamp((lt - 0.8) / 2.8));
  const p = artem(f, {bodyTurn: lerp(0.1, -0.9, turn), headTurn: lerp(0.05, -1.4, turn), eyeX: -0.6, headNod: 0.04}, 'fear');
  return <Close p={{...p, pupil: 0.7}} s={2.7} x={lerp(540, 620, turn)} light={L_MONITOR} cam={{x: 0, y: 0, zoom: 1 + 0.04 * lt, rot: 0, shake: 0.6, shakeFreq: 0.4}} extra={<Glow x={1080} y={900} r={700} color="#7fa8ff" intensity={0.22} />} />;
};

// ---------------------------------------------------------------- 8 finale
export const ZvFinal: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const S = 'z8_final';
  const black = ev(S, 'black');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < ev(S, 'door') ? <Behind f={f} t={t} /> : t < ev(S, 'ring') ? <Locked f={f} t={t} /> : t < black ? <Ring f={f} t={t} /> : <TheEnd t={t - black} />}
      {t < black ? <Post warm={0.04} /> : null}
    </AbsoluteFill>
  );
};

/** The double stands right behind Artyom in the room, looking straight at him. */
const Behind: React.FC<{f: number; t: number}> = ({f, t}) => {
  const ls = lipSync('z8_final', 'z8_d1', f);
  let dp = artem(f, {bodyTurn: 0.0, headTurn: 0.0, eyeX: 0, eyeY: 0.02}, 'neutral', 1, 91);
  dp = {...dp, blink: 0, lidDrop: 0.22, browWorry: 0.1};
  const ap = artem(f, {bodyTurn: 3.6, headTurn: 3.2}, 'fear');
  const push = ease.cam(clamp(t / 3));
  return (
    <CameraRig cam={{x: 0, y: -60 * push, zoom: 1.02 + 0.08 * push, rot: 0, shake: 0.5, shakeFreq: 0.4}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_ROOM} top="#0c0f18" bottom="#040507" />
        <AbsoluteFill style={{background: 'rgba(5,8,16,0.35)'}} />
      </Layer>
      <Layer depth={0.85}>
        <Act d={ARTEM} p={dp} x={560} y={960 + 436 * 1.9 - 80} s={1.9} id="z8d" light={L_COLD} mouth={ls.talking ? ls.mouth : undefined} legs={false} />
      </Layer>
      <Layer depth={1.2}>
        <Act d={ARTEM} p={ap} x={330} y={960 + 436 * 3.2 + 180} s={3.2} id="z8a" light={L_MONITOR} legs={false} />
      </Layer>
    </CameraRig>
  );
};

const Locked: React.FC<{f: number; t: number}> = ({f, t}) => {
  void f;
  const lt = t - ev('z8_final', 'door');
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1.05 + 0.06 * lt, rot: 0, shake: 0.4, shakeFreq: 0.4}}>
      <Layer depth={1}>
        <DoorClose chain locked light={0.8} />
      </Layer>
    </CameraRig>
  );
};

const Ring: React.FC<{f: number; t: number}> = ({f, t}) => {
  const lt = t - ev('z8_final', 'ring');
  return (
    <CameraRig cam={{x: 0, y: 0, zoom: 1.1 + 0.05 * lt, rot: fbm(f / 30, 2) * 0.6, shake: 0.6, shakeFreq: 0.5}}>
      <Layer depth={0.5}>
        <Bokeh discs={BOKEH_ROOM} top="#0c0f18" bottom="#040507" />
      </Layer>
      <Layer depth={1}>
        <ZPhone x={540} y={1000} scale={1.35} rot={-3} vibrate={1}>
          <IncomingScreen time="00:04" t={lt} />
        </ZPhone>
      </Layer>
    </CameraRig>
  );
};

const TheEnd: React.FC<{t: number}> = ({t}) => {
  const a = ease.out(clamp((t - 0.1) / 0.45));
  const b = ease.out(clamp((t - 0.6) / 0.45));
  return (
    <AbsoluteFill style={{background: '#030406', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: a}}>
        <div style={{width: 26, height: 26, borderRadius: 13, background: '#ff3b30'}} />
        <div style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: 66, letterSpacing: 10, color: '#e9ecf2'}}>{EPISODE.series}</div>
      </div>
      <div style={{marginTop: 30, width: 380 * b, height: 3, background: '#ff3b30'}} />
      <div style={{marginTop: 34, fontFamily: 'Russo One', fontSize: 110, color: '#f3efe6', letterSpacing: 8, opacity: b, transform: `scale(${1.1 - 0.1 * b})`}}>{EPISODE.next}</div>
      <div style={{position: 'absolute', bottom: 300, fontFamily: 'Montserrat', fontWeight: 500, fontSize: 30, color: '#8d8a84', opacity: b}}>{EPISODE.disclaimer}</div>
    </AbsoluteFill>
  );
};

void HALL_DOOR;
