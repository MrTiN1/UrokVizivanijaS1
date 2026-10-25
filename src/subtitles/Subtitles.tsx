// Shorts-style animated captions: bold white, yellow keywords, black outline,
// pop-in, active word emphasis. Position is per shot to keep faces clear.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CAPTIONS} from '../data';
import {ease} from '../animation/core';

export const Subtitles: React.FC<{y?: (t: number) => number; hidden?: (t: number) => boolean}> = ({y, hidden}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  if (hidden?.(t)) return null;
  const cap = CAPTIONS.find((c) => t >= c.start && t < c.end);
  if (!cap) return null;
  const age = t - cap.start;
  const pop = ease.back(Math.min(1, age / 0.16));
  const top = y ? y(t) : 1330;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '4px 36px',
          transform: `translateY(${(1 - pop) * 26}px) scale(${0.86 + 0.14 * pop})`,
          opacity: Math.min(1, age / 0.08),
        }}
      >
        {cap.words.map((w, i) => {
          const active = t >= w.start - 0.03;
          const isNow = t >= w.start && t < w.end + 0.08;
          return (
            <span
              key={i}
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 900,
                fontSize: 74,
                lineHeight: 1.12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: w.key ? '#ffd23f' : '#ffffff',
                WebkitTextStroke: '11px #0b0b0b',
                paintOrder: 'stroke fill',
                textShadow: '0 6px 0 rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.5)',
                opacity: active ? 1 : 0.55,
                transform: `scale(${isNow ? 1.07 : 1})`,
                display: 'inline-block',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
