// Final card: «ПРОДОЛЖЕНИЕ СЛЕДУЕТ» + next episode + fiction disclaimer.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Embers, Grain, Smoke, Vignette} from '../effects/Atmosphere';
import {clamp, ease} from '../animation/core';
import {EPISODE} from '../data';

export const S8EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const a = ease.out(clamp((t - 0.15) / 0.6));
  const b = ease.out(clamp((t - 0.9) / 0.6));
  const c = clamp((t - 1.6) / 0.8);
  const out = clamp((t - 4.4) / 0.6);
  return (
    <AbsoluteFill style={{background: '#050506'}}>
      <Smoke y={1500} color="#2a2422" opacity={0.5} seed={21} speed={0.5} />
      <Embers count={14} seed={9} opacity={0.6} />
      <AbsoluteFill style={{opacity: 1 - out, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: 'Russo One', fontSize: 92, color: '#f1ede4', letterSpacing: 4, textAlign: 'center', lineHeight: 1.05, transform: `scale(${1.12 - 0.12 * a})`, opacity: a, textShadow: '0 6px 30px rgba(0,0,0,0.9)'}}>
          ПРОДОЛЖЕНИЕ
          <br />
          СЛЕДУЕТ
        </div>
        <div style={{marginTop: 46, width: 300 * b, height: 4, background: '#ff4b3a', boxShadow: '0 0 14px rgba(255,75,58,0.7)'}} />
        <div style={{marginTop: 40, fontFamily: 'Oswald', fontWeight: 700, fontSize: 56, color: '#ff4b3a', letterSpacing: 5, opacity: b, transform: `translateY(${(1 - b) * 20}px)`}}>
          {EPISODE.next}
        </div>
        <div style={{position: 'absolute', bottom: 260, fontFamily: 'Montserrat', fontWeight: 500, fontSize: 30, color: '#8d8a84', opacity: c, letterSpacing: 1}}>
          {EPISODE.disclaimer}
        </div>
        <div style={{position: 'absolute', top: 230, fontFamily: 'Russo One', fontSize: 40, color: '#6f6b65', opacity: c, letterSpacing: 6}}>
          {EPISODE.series}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.8} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
