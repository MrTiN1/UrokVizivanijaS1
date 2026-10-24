import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Character} from './Character';
import {GLEB_CIVIL, GLEB_MILITARY} from './designs';
import {EXPRESSIONS, basePose} from './types';
import {SHEET_LIGHT} from './CharacterSheet';

export const HeadTest: React.FC = () => (
  <AbsoluteFill style={{background: '#555'}}>
    <svg width={2000} height={1000}>
      {[0, 0.5, -0.5].map((t, i) => (
        <Character key={i} design={i === 2 ? GLEB_MILITARY : GLEB_CIVIL} pose={{...basePose(), ...EXPRESSIONS[i === 1 ? 'anxiety' : 'neutral'], headTurn: t, bodyTurn: t, helmet: i === 2, dirt: i === 2 ? 1 : 0}} light={SHEET_LIGHT} x={330 + i * 660} y={1700} scale={2.6} idp={`h${i}`} legs={false} />
      ))}
    </svg>
  </AbsoluteFill>
);
