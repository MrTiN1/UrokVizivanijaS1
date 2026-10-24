import {Config} from '@remotion/cli/config';

Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('swangle');
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
