import React from 'react';
import {Composition, Still} from 'remotion';
import {BusCastSheet, CastSheet, GlebSheet} from './characters/CharacterSheet';
import {HeadTest} from './characters/HeadTest';
import {SCENES} from './scenes';
import {FontLoader} from './components/Fonts';
import {EPISODE} from './data';
import {Episode} from './Episode';
import {Bench} from './Bench';

const withFonts = (C: React.FC) => {
  const W: React.FC = () => (
    <>
      <FontLoader />
      <C />
    </>
  );
  return W;
};

export const Root: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={Math.round(EPISODE.duration * 30)} fps={30} width={1080} height={1920} defaultProps={{subtitles: true, banner: true}} />
    {EPISODE.scenes
      .filter((s) => SCENES[s.component])
      .map((s) => (
        <Composition key={s.id} id={s.component} component={withFonts(SCENES[s.component])} durationInFrames={Math.round(s.duration * 30)} fps={30} width={1080} height={1920} />
      ))}
    <Composition id="Bench" component={Bench as React.FC} durationInFrames={300} fps={30} width={1080} height={1920} defaultProps={{which: 'empty'}} />
    <Still id="GlebSheet" component={GlebSheet} width={2400} height={2700} />
    <Still id="HeadTest" component={HeadTest} width={2000} height={1000} />
    <Still id="CastSheet" component={CastSheet} width={2400} height={2700} />
    <Still id="BusCastSheet" component={BusCastSheet} width={2400} height={2700} />
  </>
);
