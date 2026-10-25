// Performance bench: renders one building block alone (prop `which`).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {WindowView} from './scenes/bus/world/Places';
import {Rain, RainOnGlass, Mist, Splashes, WetReflections, LightCone, Glow} from './effects/Weather';
import {AisleShot, GlebWindowShot} from './scenes/bus/shots';
import {Post} from './scenes/bus/common';
import {Act, L_BUS, seatedPose} from './scenes/bus/common';
import {GLEB_CIVIL} from './characters/designs';
import {BuildingRow, blocks} from './scenes/bus/world/City';

export const Bench: React.FC<{which: string}> = ({which}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {which === 'empty' ? null : null}
      {which === 'window' ? <WindowView t={t} passes={[1]} drops={false} /> : null}
      {which === 'windowdrops' ? <WindowView t={t} passes={[1]} /> : null}
      {which === 'buildings' ? <BuildingRow base={1300} blds={blocks(9, 30, -400, 6000, 500, 1200)} /> : null}
      {which === 'rain' ? <Rain count={120} /> : null}
      {which === 'rainblur' ? <Rain count={50} blur={1.5} /> : null}
      {which === 'glass' ? <RainOnGlass w={1080} h={1920} density={1.6} /> : null}
      {which === 'mist' ? <Mist y={1500} /> : null}
      {which === 'splash' ? <Splashes /> : null}
      {which === 'refl' ? <WetReflections ground={1400} lights={[{x: 300, y: 800, color: '#ffc46b', size: 80}, {x: 700, y: 900, color: '#ffc46b', size: 80}]} /> : null}
      {which === 'cone' ? <LightCone x={540} y={300} w1={600} h={1200} /> : null}
      {which === 'glow' ? <Glow x={540} y={500} r={300} color="#ffc46b" /> : null}
      {which === 'aisle' ? <AisleShot facing="front" cam={{x: 0, y: 0, zoom: 1, rot: 0, shake: 0}} /> : null}
      {which === 'gleb' ? <Act d={GLEB_CIVIL} p={seatedPose(0.5)} x={540} y={1500} s={1.5} id="b" light={L_BUS} /> : null}
      {which === 'post' ? <Post /> : null}
      {which.startsWith('gws') ? (
        <GlebWindowShot
          t={t}
          reflection={!which.includes('noref')}
          cam={{x: 0, y: 0, zoom: which.includes('zoom') ? 1.6 : 1, rot: 0, shake: 0}}
          gleb={{d: GLEB_CIVIL, p: seatedPose(0.55), x: 560, y: 1560, s: 1.55, id: 'bg', light: L_BUS}}
        />
      ) : null}
    </AbsoluteFill>
  );
};
