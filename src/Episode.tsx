// Full episode edit: scenes laid out from episode.json, scene-in fades,
// burned-in captions (switchable with the `subtitles` prop).
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {EPISODE} from './data';
import {SCENES} from './scenes';
import {Subtitles} from './subtitles/Subtitles';
import {FontLoader} from './components/Fonts';
import {clamp} from './animation/core';

export type EpisodeProps = {subtitles: boolean};

// caption top (px) per time range — keeps captions off faces
const CAPTION_Y: [number, number, number][] = [
  [0, 8, 1450],
  [8, 12.5, 1660],
  [25, 32.5, 1180],
];
const captionY = (t: number) => CAPTION_Y.find(([a, b]) => t >= a && t < b)?.[2] ?? 1330;

// fade-in from black at the start of a scene (seconds); Hook/College handle their own transition
const FADE_IN: Record<string, number> = {s3_agitation: 0.25, s4_signing: 0.3, s5_training: 0.35, s6_assignment: 0.35, s7_transport: 0.6, s8_end: 0.4};

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

export const Episode: React.FC<EpisodeProps> = ({subtitles = true}) => (
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
    {subtitles ? <Subtitles y={captionY} /> : null}
  </AbsoluteFill>
);
