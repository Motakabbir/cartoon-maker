import { Emotion } from './animation';

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  features: CharacterFeatures;
  animation: CharacterAnimationState;
}

export interface CharacterFeatures {
  face: {
    eyes: string;
    nose: string;
    mouth: string;
    hairstyle: string;
    skinTone: string;
  };
  outfit: {
    type: string;
    color: string;
    accessories: string[];
  };
  expression: Emotion;
}

export interface CharacterAnimationState {
  currentPose: string;
  currentExpression: Emotion;
}

export interface CharacterGenerationPrompt {
  description: string;
  style: 'cartoon' | 'anime' | 'realistic' | 'pixel-art';
  mood: Emotion;
}