import {Config} from '@remotion/cli/config';

Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(4);
// 'angle' is ~5× faster than 'swangle' on this CPU-only machine (swangle serialises all tabs)
Config.setChromiumOpenGlRenderer('angle');
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
