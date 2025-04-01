'use server';

import { createCharacter } from '@/lib/database-helpers';
import { Character } from '../types/character';

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