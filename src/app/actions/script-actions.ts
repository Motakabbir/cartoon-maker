'use server';

import { createScript, createScene, getAllCharacters } from '@/lib/database-helpers';

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

export async function createNewScript(data: {
  title: string;
  fps: number;
  resolution: { width: number; height: number; }
}) {
  try {
    // Create the script
    const script = await createScript(data);

    // Create an initial empty scene
    await createScene({
      scriptId: script.id,
      background: 'default_background',
      lighting: 'natural',
      timeOfDay: 'day',
      weather: 'clear',
      duration: 5.0,
      order: 1
    });

    return script;
  } catch (error) {
    console.error('Failed to create script:', error);
    throw new Error('Failed to create script');
  }
}