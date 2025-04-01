export type Lighting = 'bright' | 'dim' | 'dark' | 'natural';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'clear' | 'rain' | 'snow' | 'cloudy';

export interface Scene {
  id: string;
  background: string;
  backgroundUrl?: string;
  lighting: Lighting;
  weather?: Weather;
  timeOfDay: TimeOfDay;
  characters: CharacterPosition[];
  dialogues: Dialogue[];
  actions: Action[];
  duration: number;
}

export interface CharacterPosition {
  characterId: string;
  position: Position3D;
  rotation: Rotation3D;
  scale?: number; // Optional with implicit default of 1
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

export interface Script {
  id: string;
  scenes: SceneScript[];
  duration: number;
  resolution: Resolution;
  fps: number;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface SceneScript {
  sceneId: string;
  duration: number;
  background: string;
  backgroundUrl?: string;
  lighting: Scene['lighting'];
  timeOfDay: Scene['timeOfDay'];
  weather?: Scene['weather'];
  characters: CharacterPosition[];
  dialogues: Dialogue[];
  actions: Action[];
}

export interface Dialogue {
  characterId: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
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

export interface Action {
  characterId: string;
  type: ActionType;
  params: ActionParams;
  startTime: number;
  duration: number;
}

export type ActionType = 'move' | 'rotate' | 'scale' | 'gesture' | 'expression' | 'lipsync';

export interface ActionParams {
  from?: Position3D | Rotation3D | number;
  to?: Position3D | Rotation3D | number;
  gesture?: string;
  expression?: string;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface VideoExportSettings {
  resolution: Resolution;
  fps: number;
  format: 'mp4' | 'webm';
  quality: number;
  audioEnabled: boolean;
}