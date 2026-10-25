// Official NATRIA VPN mid-roll banner. Plays the file supplied by the
// advertiser (green key removed by scripts/banner/prepare_banner.py) at the
// configured time, centred, at the configured width, aspect kept, speed as
// configured (≤ 1.3). Its own sound is mixed unchanged by build_soundtrack.py,
// so the video element here is muted.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import meta from '../../assets/banner/banner_meta.json';
import {BannerCfg} from '../data';

export const bannerBox = (cfg: BannerCfg) => {
  const h = (cfg.width * meta.height) / meta.width;
  return {x: cfg.center[0] - cfg.width / 2, y: cfg.center[1] - h / 2, w: cfg.width, h};
};

export const NatriaBanner: React.FC<{cfg: BannerCfg; fps?: number}> = ({cfg, fps = 30}) => {
  if (!cfg.enabled) return null;
  if (cfg.speed > 1.3) throw new Error('NATRIA banner: speed above 1.3× is not allowed');
  const box = bannerBox(cfg);
  const frames = Math.round(((meta.duration / cfg.speed) * fps));
  return (
    <Sequence from={Math.round(cfg.at * fps)} durationInFrames={frames} name="NATRIA VPN banner">
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <OffthreadVideo
          src={staticFile(cfg.video)}
          transparent
          muted
          playbackRate={cfg.speed}
          style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h}}
        />
      </AbsoluteFill>
    </Sequence>
  );
};
