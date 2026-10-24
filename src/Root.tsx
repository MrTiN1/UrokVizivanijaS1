import React from 'react';
import {Composition, Still} from 'remotion';
import {CastSheet, GlebSheet} from './characters/CharacterSheet';
import {HeadTest} from './characters/HeadTest';

export const Root: React.FC = () => (
  <>
    <Still id="GlebSheet" component={GlebSheet} width={2400} height={2700} />
    <Still id="HeadTest" component={HeadTest} width={2000} height={1000} />
    <Still id="CastSheet" component={CastSheet} width={2400} height={2700} />
  </>
);
void Composition;
