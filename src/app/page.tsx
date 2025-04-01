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
    setActiveTab('script'); // Automatically move to script tab after character creation
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
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-purple-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
            AI Cartoon Creator
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl max-w-2xl text-purple-100">
            Create stunning animated cartoons with AI-powered character generation, scene composition, and voice synthesis.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 rounded-lg bg-purple-100/50 p-1" aria-label="Tabs">
            {[
              { id: 'character', label: 'Character Creation' },
              { id: 'script', label: 'Script Editor' },
              { id: 'voice', label: 'Voice Over' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full rounded-md py-2.5 px-3 text-sm font-medium leading-5 ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-700 shadow'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                } transition-all duration-200`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100/50 p-6">
          {activeTab === 'character' && (
            <CharacterCreator onCharacterCreated={handleCharacterCreated} />
          )}
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
      </div>
    </main>
  );
}
