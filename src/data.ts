// Episode data produced by the pipeline (scripts/). The active episode is
// chosen by scripts/set_episode.py (writes src/current_episode.ts).
import {episode, voices, subtitles} from './current_episode';

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
export type BannerCfg = {
  enabled: boolean;
  source: string;
  video: string;
  audio: string;
  at: number;
  duration: number;
  speed: number;
  center: [number, number];
  width: number;
  minAreaRatio: number;
};
export type CaptionCfg = {defaultY: number; y: [number, number, number][]; hide: [number, number][]};

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
  banner?: BannerCfg;
  captions?: CaptionCfg;
};
export const VOICES = voices as unknown as Record<string, VoiceInfo>;
export const CAPTIONS = subtitles as unknown as Caption[];

export const scene = (id: string) => EPISODE.scenes.find((s) => s.id === id)!;
export const ev = (sceneId: string, key: string) => scene(sceneId).events[key] as number;
export const evArr = (sceneId: string, key: string) => scene(sceneId).events[key] as number[];
export const line = (sceneId: string, lineId: string) => scene(sceneId).lines.find((l) => l.id === lineId)!;
