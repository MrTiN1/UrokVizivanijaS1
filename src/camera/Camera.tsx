// Virtual camera with parallax layers. A scene is a stack of <Layer depth>.
// The camera (x, y, zoom, rotation, shake) is applied per layer scaled by its
// depth, which gives a 2.5D parallax "multiplane" look. Layers can also be
// defocused (rack focus) with `blur`.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fbm} from '../animation/core';

export type Cam = {
  x: number; // world units (px at depth 1)
  y: number;
  zoom: number; // 1 = neutral
  rot: number; // deg
  shake: number; // amplitude px
  shakeFreq?: number;
};

export const CAM0: Cam = {x: 0, y: 0, zoom: 1, rot: 0, shake: 0};

const CamCtx = createContext<Cam>(CAM0);

export const CameraRig: React.FC<{cam: Cam; children: React.ReactNode; width?: number; height?: number}> = ({cam, children}) => (
  <CamCtx.Provider value={cam}>
    <AbsoluteFill style={{overflow: 'hidden'}}>{children}</AbsoluteFill>
  </CamCtx.Provider>
);

/**
 * depth: 1 = subject plane. <1 = far background (moves less), >1 = foreground
 * (moves more). Zoom also scales with depth so close layers "push" faster.
 */
export const Layer: React.FC<{
  depth?: number;
  blur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  origin?: [number, number];
}> = ({depth = 1, blur = 0, children, style, origin = [540, 960]}) => {
  const cam = useContext(CamCtx);
  const frame = useCurrentFrame();
  const f = cam.shakeFreq ?? 1;
  const sx = cam.shake ? fbm((frame * f) / 3.2, 1) * cam.shake : 0;
  const sy = cam.shake ? fbm((frame * f) / 3.0, 7) * cam.shake : 0;
  const z = 1 + (cam.zoom - 1) * depth;
  const tx = -(cam.x * depth) + sx * depth;
  const ty = -(cam.y * depth) + sy * depth;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px) rotate(${cam.rot * Math.min(depth, 1.5)}deg) scale(${z})`,
        transformOrigin: `${origin[0]}px ${origin[1]}px`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Full-frame SVG canvas in 1080×1920 world units. */
export const Svg: React.FC<{children: React.ReactNode; vb?: string; style?: React.CSSProperties}> = ({children, vb = '0 0 1080 1920', style}) => (
  <svg viewBox={vb} width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);
