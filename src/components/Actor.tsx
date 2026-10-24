import React from 'react';
import {Character, CharacterProps} from '../characters/Character';

/** Character placed in a full-frame 1080×1920 SVG (world units). */
export const Actor: React.FC<CharacterProps & {style?: React.CSSProperties}> = ({style, ...p}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
    <Character {...p} />
  </svg>
);
