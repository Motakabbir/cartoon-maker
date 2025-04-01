'use client';

import { useState } from 'react';
import { Character, CharacterGenerationPrompt } from '../types/character';
import { Emotion } from '../types/animation';
import { generateCharacter } from '../services/aiService';
import { createCharacter } from '@/lib/database-helpers';
import Image from 'next/image';

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character & { id: string }) => void;
}

export default function CharacterCreator({ onCharacterCreated }: CharacterCreatorProps) {
  const [prompt, setPrompt] = useState<CharacterGenerationPrompt>({
    description: '',
    style: 'cartoon',
    mood: 'neutral'
  });
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCharacterHandler = async () => {
    if (!prompt.description) {
      setError('Please provide a character description');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const generatedCharacter = await generateCharacter(prompt);
      
      // Store the character in the database
      const storedCharacter = await createCharacter({
        name: generatedCharacter.name || prompt.description.split(' ').slice(0, 2).join(' '),
        model: JSON.stringify({
          features: generatedCharacter.features,
          imageUrl: generatedCharacter.imageUrl,
          style: prompt.style,
          mood: prompt.mood
        })
      });

      // Combine the generated character with the database ID
      const finalCharacter = {
        ...generatedCharacter,
        id: storedCharacter.id
      };

      setCharacter(finalCharacter);
      onCharacterCreated(finalCharacter);
    } catch (err) {
      setError('Failed to generate character. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-lg font-semibold">
          Character Description
        </label>
        <textarea
          id="description"
          className="w-full p-2 border rounded"
          value={prompt.description}
          onChange={(e) => setPrompt({ ...prompt, description: e.target.value })}
          placeholder="Describe your character..."
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="style" className="block text-sm font-medium mb-1">
              Style
            </label>
            <select
              id="style"
              className="w-full p-2 border rounded"
              value={prompt.style}
              onChange={(e) => setPrompt({ ...prompt, style: e.target.value as 'cartoon' | 'anime' | 'realistic' | 'pixel-art' })}
            >
              <option value="cartoon">Cartoon</option>
              <option value="anime">Anime</option>
              <option value="realistic">Realistic</option>
              <option value="pixel-art">Pixel Art</option>
            </select>
          </div>

          <div>
            <label htmlFor="mood" className="block text-sm font-medium mb-1">
              Mood
            </label>
            <select
              id="mood"
              className="w-full p-2 border rounded"
              value={prompt.mood}
              onChange={(e) => setPrompt({ ...prompt, mood: e.target.value as Emotion })}
            >
              <option value="neutral">Neutral</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="angry">Angry</option>
              <option value="surprised">Surprised</option>
              <option value="scared">Scared</option>
              <option value="disgusted">Disgusted</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateCharacterHandler}
          disabled={isLoading}
          className={`px-4 py-2 text-white rounded ${
            isLoading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Character'}
        </button>

        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>

      {character && character.imageUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Generated Character</h3>
          <div className="relative w-full h-[400px] border rounded overflow-hidden">
            <Image
              src={character.imageUrl}
              alt="Generated character"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">Features</h4>
              <ul className="mt-2">
                <li>Eyes: {character.features.face.eyes}</li>
                <li>Hair: {character.features.face.hairstyle}</li>
                <li>Expression: {character.features.expression}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Outfit</h4>
              <ul className="mt-2">
                <li>Type: {character.features.outfit.type}</li>
                <li>Color: {character.features.outfit.color}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}