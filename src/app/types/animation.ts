export interface Scene {
  id: string;
  background: string;
  lighting: 'natural' | 'studio' | 'dramatic' | 'dark';
  timeOfDay: 'day' | 'night' | 'sunset' | 'sunrise';
  weather: Weather;
  duration: number;
  characters: SceneCharacter[];
  dialogues: Dialogue[];
  actions: Action[];
}

export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow' | 'foggy' | 'stormy';

export interface SceneCharacter {
  characterId: string;
  position: Vector3;
  rotation: Vector3;
  scale: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Dialogue {
  id?: string;
  characterId: string;
  text: string;
  emotion: Emotion;
  voiceSettings: VoiceSettings;
  startTime?: number;
  duration?: number;
}

export interface VoiceSettings {
  voice: string;
  pitch: number;
  speed: number;
  emphasis?: number;
}

export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'scared' | 'disgusted';

export interface Action {
  id?: string;
  characterId: string;
  type: ActionType;
  params: ActionParams;
  startTime: number;
  duration: number;
}

export type ActionType = 'move' | 'rotate' | 'scale' | 'gesture' | 'expression' | 'lipsync';

export interface BaseActionParams {
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface TransformActionParams extends BaseActionParams {
  from: Vector3;
  to: Vector3;
}

export interface ScaleActionParams extends BaseActionParams {
  from: number;
  to: number;
}

export interface GestureActionParams extends BaseActionParams {
  gesture: 'wave' | 'point' | 'clap' | 'jump' | 'dance' | 'spin';
  intensity?: number;
}

export interface ExpressionActionParams extends BaseActionParams {
  expression: Emotion;
  intensity?: number;
}

export interface LipsyncActionParams extends BaseActionParams {
  from: number;
  to: number;
}

export type ActionParams = 
  | TransformActionParams 
  | ScaleActionParams 
  | GestureActionParams 
  | ExpressionActionParams 
  | LipsyncActionParams;

export interface Resolution {
  width: number;
  height: number;
}

export interface Script {
  id: string;
  title?: string;
  scenes: SceneScript[];
  duration: number;
  resolution: Resolution;
  fps: number;
}

export interface SceneScript extends Omit<Scene, 'id'> {
  sceneId: string;
  backgroundUrl?: string;
}