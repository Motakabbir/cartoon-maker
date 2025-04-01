'use client';

import { useState } from 'react';
import CharacterCreator from './components/CharacterCreator';
import ScriptEditor from './components/ScriptEditor';
import VoiceOverGenerator from './components/VoiceOverGenerator';
import { VoiceSettings, Dialogue } from './types/animation';
import { Character } from './types/character';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'character' | 'script' | 'voice'>('character');
  const [character, setCharacter] = useState<Character | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue>({
    characterId: '',
    text: '',
    voiceSettings: {
      voice: 'default',
      pitch: 1.0,
      speed: 1.0,
      emphasis: 1.0
    },
    emotion: 'neutral'
  });

  const handleCharacterCreated = (newCharacter: Character) => {
    setCharacter(newCharacter);
  };

  const handleVoiceSettingsChange = (settings: VoiceSettings) => {
    setDialogue(prev => ({
      ...prev,
      voiceSettings: settings
    }));
  };

  const handleVoicePreview = () => {
    // Will be handled by VoiceOverGenerator component
  };

  const handleVoiceGenerate = async (audioBlob: Blob) => {
    // Handle the generated audio
    console.log('Audio generated:', audioBlob);
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Cartoon Creator</h1>
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('character')}
                className={`py-2 px-1 border-b-2 ${
                  activeTab === 'character'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Character Creation
              </button>
              <button
                onClick={() => setActiveTab('script')}
                className={`py-2 px-1 border-b-2 ${
                  activeTab === 'script'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Script Editor
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`py-2 px-1 border-b-2 ${
                  activeTab === 'voice'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Voice Over
              </button>
            </nav>
          </div>
        </div>
        {activeTab === 'character' && <CharacterCreator onCharacterCreated={handleCharacterCreated} />}
        {activeTab === 'script' && <ScriptEditor />}
        {activeTab === 'voice' && (
          <VoiceOverGenerator
            dialogue={dialogue}
            onVoiceSettingsChange={handleVoiceSettingsChange}
            onPreview={handleVoicePreview}
            onGenerate={handleVoiceGenerate}
          />
        )}
      </div>
    </main>
  );
}
