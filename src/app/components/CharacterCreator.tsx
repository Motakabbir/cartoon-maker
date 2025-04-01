'use client';

import { useState } from 'react';
import { Character, CharacterGenerationPrompt } from '../types/character';
import { Emotion } from '../types/animation';
import { generateCharacter } from '../services/aiService';
import { createNewCharacter } from '@/app/actions/character-actions';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faUser, faTheaterMasks, faPalette } from '@fortawesome/free-solid-svg-icons';

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
      
      // Store the character using server action
      const storedCharacter = await createNewCharacter({
        name: generatedCharacter.name || prompt.description.split(' ').slice(0, 2).join(' '),
        model: JSON.stringify({
          features: generatedCharacter.features,
          imageUrl: generatedCharacter.imageUrl,
          style: prompt.style,
          mood: prompt.mood
        })
      });

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
    <div className="space-y-8">
      {/* Character Description Input */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 text-purple-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="text-purple-600" />
          Character Description
        </h3>
        <textarea
          className="w-full p-4 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[120px] bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder:text-purple-300"
          value={prompt.description}
          onChange={(e) => setPrompt({ ...prompt, description: e.target.value })}
          placeholder="Describe your character's appearance, personality, and style..."
        />
      </div>

      {/* Style and Mood Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-purple-100 shadow-sm">
          <h4 className="text-base font-medium mb-4 text-purple-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faPalette} className="text-purple-600" />
            Art Style
          </h4>
          <select
            className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80"
            value={prompt.style}
            onChange={(e) => setPrompt({ ...prompt, style: e.target.value as 'cartoon' | 'anime' | 'realistic' | 'pixel-art' })}
          >
            <option value="cartoon">Cartoon</option>
            <option value="anime">Anime</option>
            <option value="realistic">Realistic</option>
            <option value="pixel-art">Pixel Art</option>
          </select>
        </div>

        <div className="bg-white rounded-lg p-6 border border-purple-100 shadow-sm">
          <h4 className="text-base font-medium mb-4 text-purple-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faTheaterMasks} className="text-purple-600" />
            Initial Mood
          </h4>
          <select
            className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80"
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

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={generateCharacterHandler}
          disabled={isLoading || !prompt.description}
          className={`w-full sm:w-auto px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isLoading || !prompt.description
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          <FontAwesomeIcon icon={faMagic} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Generating Character...' : 'Generate Character'}
        </button>

        {error && (
          <div className="w-full p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center">
            {error}
          </div>
        )}
      </div>

      {/* Generated Character Preview */}
      {character && character.imageUrl && (
        <div className="bg-white rounded-lg border border-purple-100 shadow-lg overflow-hidden">
          <h3 className="text-lg font-semibold p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-transparent">
            Generated Character
          </h3>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Character Image */}
              <div className="relative aspect-square bg-purple-50/50 rounded-lg overflow-hidden">
                <Image
                  src={character.imageUrl}
                  alt="Generated character"
                  fill
                  className="object-contain transform transition-transform duration-300 hover:scale-105"
                  priority
                />
              </div>

              {/* Character Details */}
              <div className="space-y-6">
                <div className="bg-purple-50/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-purple-900">Features</h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Eyes:</span>
                      {character.features.face.eyes}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Hair:</span>
                      {character.features.face.hairstyle}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Expression:</span>
                      {character.features.expression}
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-purple-900">Outfit</h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Type:</span>
                      {character.features.outfit.type}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Color:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-purple-200"
                          style={{ backgroundColor: character.features.outfit.color }}
                        />
                        {character.features.outfit.color}
                      </div>
                    </li>
                    {character.features.outfit.accessories.length > 0 && (
                      <li className="flex items-center gap-2">
                        <span className="font-medium">Accessories:</span>
                        {character.features.outfit.accessories.join(', ')}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}