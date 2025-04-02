'use server';

import { createCharacter } from '@/lib/database-helpers';
import { Character, CharacterGenerationPrompt } from '../types/character';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateCharacterServerAction(prompt: CharacterGenerationPrompt): Promise<Character> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  try {
    // Validate prompt
    if (!prompt.description || !prompt.style || !prompt.mood) {
      throw new Error('Invalid prompt: missing required fields');
    }

    // Generate character image using Stable Diffusion
    const output = await replicate.run(
      "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
      {
        input: {
          prompt: `high quality ${prompt.style} character: ${prompt.description}, ${prompt.mood} expression, full body shot, white background`,
          negative_prompt: "blurry, dark, multiple characters, watermark",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      }
    ).catch((error) => {
      console.error('Replicate API error:', error);
      
      // Handle billing-specific errors
      if (error.status === 402) {
        throw new Error(
          'Billing setup required for character generation. Please set up billing at https://replicate.com/account/billing#billing. ' +
          'If you have recently set up billing, please wait a few minutes before trying again.'
        );
      }
      
      throw new Error(`Replicate API error: ${error.message}`);
    });

    if (!output) {
      throw new Error('No output received from Replicate API');
    }

    const imageUrl = Array.isArray(output) ? output[0] : String(output);
    
    if (!imageUrl) {
      throw new Error('No image URL received from Replicate API');
    }

    const character: Character = {
      id: Date.now().toString(),
      name: 'Generated Character',
      imageUrl,
      features: {
        face: {
          eyes: prompt.description.toLowerCase().includes('eyes') ? prompt.description.split('eyes')[0].split(' ').pop() || 'normal' : 'normal',
          nose: 'normal',
          mouth: prompt.mood === 'happy' ? 'smile' : prompt.mood === 'sad' ? 'frown' : 'neutral',
          hairstyle: prompt.description.toLowerCase().includes('hair') ? prompt.description.split('hair')[0].split(' ').pop() || 'normal' : 'normal',
          skinTone: prompt.description.toLowerCase().includes('skin') ? prompt.description.split('skin')[0].split(' ').pop() || 'medium' : 'medium'
        },
        outfit: {
          type: prompt.description.toLowerCase().includes('wearing') ? prompt.description.split('wearing')[1].split(' ')[1] || 'casual' : 'casual',
          color: prompt.description.toLowerCase().includes('color') ? prompt.description.split('color')[0].split(' ').pop() || 'neutral' : 'neutral',
          accessories: []
        },
        expression: prompt.mood || 'neutral'
      },
      animation: {
        currentPose: 'idle',
        currentExpression: prompt.mood || 'neutral'
      }
    };

    // Store the character in the database
    const storedCharacter = await createCharacter({
      name: character.name,
      model: JSON.stringify({
        features: character.features,
        imageUrl: character.imageUrl,
        style: prompt.style,
        mood: prompt.mood
      })
    }).catch((error) => {
      console.error('Database error:', error);
      throw new Error(`Failed to store character: ${error.message}`);
    });

    return {
      ...character,
      id: storedCharacter.id
    };
  } catch (error) {
    console.error('Error generating character:', error);
    throw error instanceof Error ? error : new Error('Failed to generate character');
  }
}

export async function createNewCharacter(data: { 
  name: string;
  model: string;
}) {
  try {
    const storedCharacter = await createCharacter({
      name: data.name,
      model: data.model
    });
    return storedCharacter;
  } catch (error) {
    console.error('Failed to create character:', error);
    throw new Error('Failed to create character');
  }
}