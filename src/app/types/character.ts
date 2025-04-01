export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  features: {
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
    expression: string;
  };
  animation: {
    currentPose: string;
    currentExpression: string;
  };
}

export interface CharacterGenerationPrompt {
  description: string;
  style?: string;
  mood?: string;
}