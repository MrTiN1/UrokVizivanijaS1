// Full episode edit: scenes laid out from episode.json, scene-in fades,
// burned-in captions (switchable with the `subtitles` prop) and the
// sponsor banner (if configured). Caption positions / hidden windows come
// from episode.json → "captions".
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {EPISODE} from './data';
import {SCENES} from './scenes';
import {Subtitles} from './subtitles/Subtitles';
import {FontLoader} from './components/Fonts';
import {NatriaBanner} from './components/NatriaBanner';
import {clamp} from './animation/core';

export type EpisodeProps = {subtitles: boolean; banner?: boolean};

const captionY = (t: number) => {
  const c = EPISODE.captions;
  if (!c) return 1330;
  return c.y.find(([a, b]) => t >= a && t < b)?.[2] ?? c.defaultY;
};
const captionHidden = (t: number) => {
  const c = EPISODE.captions;
  const hide = [...(c?.hide ?? [])];
  const b = EPISODE.banner;
  if (b?.enabled) hide.push([b.at - 0.2, b.at + b.duration / b.speed + 0.2]);
  return hide.some(([a, z]) => t >= a && t <= z);
};

// fade-in from black at the start of a scene (seconds)
const FADE_IN: Record<string, number> = {s3_agitation: 0.25, s4_signing: 0.3, s5_training: 0.35, s6_assignment: 0.35, s7_transport: 0.6, s8_end: 0.4, s2_college: 0.35, s3_stop: 0.3, s4_passengers: 0.25, s7_photo: 0.3};

const SceneFade: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const a = dur > 0 ? 1 - clamp(f / (dur * 30)) : 0;
  return (
    <AbsoluteFill>
      {children}
      {a > 0 ? <AbsoluteFill style={{background: '#000', opacity: a}} /> : null}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<EpisodeProps> = ({subtitles = true, banner = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <FontLoader />
    {EPISODE.scenes.map((s) => {
      const C = SCENES[s.component];
      return (
        <Sequence key={s.id} from={Math.round(s.start * 30)} durationInFrames={Math.round(s.duration * 30)} name={s.name}>
          <SceneFade dur={FADE_IN[s.id] ?? 0}>
            <C />
          </SceneFade>
        </Sequence>
      );
    })}
    {subtitles ? <Subtitles y={captionY} hidden={captionHidden} /> : null}
    {banner && EPISODE.banner ? <NatriaBanner cfg={EPISODE.banner} /> : null}
  </AbsoluteFill>
);
