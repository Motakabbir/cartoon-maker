'use server';

import { createScript, getAllCharacters } from '@/lib/database-helpers';

export async function initializeNewScript() {
  try {
    const newScript = await createScript({
      title: 'New Script',
      fps: 30,
      resolution: { width: 1920, height: 1080 }
    });

    const existingCharacters = await getAllCharacters();
    const convertedCharacters = existingCharacters.map(char => {
      const model = JSON.parse(char.model);
      return {
        id: char.id,
        name: char.name,
        features: model.features,
        imageUrl: model.imageUrl,
        style: model.style,
        mood: model.mood,
        animation: {
          currentPose: 'idle',
          currentExpression: 'neutral'
        }
      };
    });

    return {
      script: {
        id: newScript.id,
        scenes: [],
        duration: 0,
        resolution: { width: 1920, height: 1080 },
        fps: 30
      },
      characters: convertedCharacters
    };
  } catch (error) {
    console.error('Failed to initialize script:', error);
    throw error;
  }
}