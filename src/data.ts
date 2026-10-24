// Episode data produced by the pipeline (scripts/). Swap these imports for a
// new episode folder to build the next episode.
import episode from '../episodes/episode_01/episode.json';
import voices from '../episodes/episode_01/build/voices.json';
import subtitles from '../episodes/episode_01/build/subtitles.json';

export type Word = {w: string; start: number; end: number; key?: boolean};
export type VisemeCue = {v: string; start: number; end: number};
export type VoiceInfo = {speaker: string; text: string; file: string; duration: number; words: Word[]; visemes: VisemeCue[]};
export type Caption = {line: string; speaker: string; start: number; end: number; words: Word[]};
export type Line = {id: string; speaker: string; at: number; text: string; keywords?: string[]};
export type SceneCfg = {
  id: string;
  name: string;
  component: string;
  start: number;
  duration: number;
  lines: Line[];
  events: Record<string, number | number[] | number[][]>;
  shots: [number, number, string][];
};

export const EPISODE = episode as unknown as {
  id: string;
  series: string;
  number: number;
  title: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  disclaimer: string;
  next: string;
  scenes: SceneCfg[];
};
export const VOICES = voices as unknown as Record<string, VoiceInfo>;
export const CAPTIONS = subtitles as unknown as Caption[];

export const scene = (id: string) => EPISODE.scenes.find((s) => s.id === id)!;
export const ev = (sceneId: string, key: string) => scene(sceneId).events[key] as number;
export const evArr = (sceneId: string, key: string) => scene(sceneId).events[key] as number[];
export const line = (sceneId: string, lineId: string) => scene(sceneId).lines.find((l) => l.id === lineId)!;
