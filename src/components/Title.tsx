import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ease, fbm} from '../animation/core';

/** Series title slam: big Russo One title + red episode line. t = seconds since hit. */
export const SeriesTitle: React.FC<{t: number; series: string; sub: string; top?: number; out?: number}> = ({t, series, sub, top = 250, out = 0}) => {
  if (t < -0.1) return null;
  const k = ease.out(clamp(t / 0.35));
  const scale = 1.35 - 0.35 * k;
  const shake = t < 0.5 ? fbm(t * 40, 3) * 10 * (1 - t / 0.5) : 0;
  const subK = ease.out(clamp((t - 0.35) / 0.4));
  const words = series.split(' ');
  return (
    <AbsoluteFill style={{opacity: (1 - out) * clamp(t / 0.06), pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `translate(${shake}px, ${shake * 0.6}px) scale(${scale})`}}>
        {words.map((w, i) => (
          <div
            key={i}
            style={{
              fontFamily: 'Russo One',
              fontSize: 132,
              lineHeight: 1.0,
              color: '#f3efe6',
              letterSpacing: 4,
              textShadow: '0 8px 0 rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.65), 0 0 2px #000',
              WebkitTextStroke: '3px rgba(0,0,0,0.6)',
              paintOrder: 'stroke fill',
            }}
          >
            {w}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: top + words.length * 132 + 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: subK,
          transform: `translateY(${(1 - subK) * 20}px)`,
        }}
      >
        <span style={{fontFamily: 'Oswald', fontWeight: 700, fontSize: 58, color: '#ff4b3a', letterSpacing: 6, textShadow: '0 4px 12px rgba(0,0,0,0.8)'}}>{sub}</span>
        <div style={{margin: '14px auto 0', width: 360 * subK, height: 4, background: '#ff4b3a', boxShadow: '0 0 12px rgba(255,75,58,0.6)'}} />
      </div>
    </AbsoluteFill>
  );
};
