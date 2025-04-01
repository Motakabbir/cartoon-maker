'use client';

import { useState, useCallback } from 'react';
import { Scene, Dialogue, Action } from '../types/animation';
import { Character } from '../types/character';
import CharacterCreator from './CharacterCreator';
import SceneTimeline from './SceneTimeline';
import ScriptEditor from './ScriptEditor';
import AnimatedCharacter from './AnimatedCharacter';
import { renderScene } from '../utils/renderScene';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faDownload } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

export default function VideoComposer() {
  const [scene, setScene] = useState<Scene>({
    id: 'main',
    background: 'default',
    lighting: 'natural',
    timeOfDay: 'day',
    weather: 'clear',
    duration: 60,
    characters: [],
    dialogues: [],
    actions: []
  });

  const [characters, setCharacters] = useState<Character[]>([]);
  const [scriptContent, setScriptContent] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCharacterCreated = useCallback((character: Character) => {
    setCharacters(prev => [...prev, character]);
    setScene(prev => ({
      ...prev,
      characters: [...prev.characters, {
        characterId: character.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      }]
    }));
  }, []);

  const handleScriptChange = useCallback((content: string) => {
    setScriptContent(content);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDialogueAdd = useCallback((dialogue: Dialogue) => {
    setScene(prev => ({
      ...prev,
      dialogues: [...prev.dialogues, dialogue]
    }));
  }, []);

  const handleActionAdd = useCallback((action: Action) => {
    setScene(prev => ({
      ...prev,
      actions: [...prev.actions, action]
    }));
  }, []);

  const handleDialogueEdit = useCallback((index: number, dialogue: Dialogue) => {
    setScene(prev => ({
      ...prev,
      dialogues: prev.dialogues.map((d, i) => i === index ? dialogue : d)
    }));
  }, []);

  const handleActionEdit = useCallback((index: number, action: Action) => {
    setScene(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === index ? action : a)
    }));
  }, []);

  const handleDialogueDelete = useCallback((index: number) => {
    setScene(prev => ({
      ...prev,
      dialogues: prev.dialogues.filter((_, i) => i !== index)
    }));
  }, []);

  const handleActionDelete = useCallback((index: number) => {
    setScene(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  }, []);

  const handleRender = async () => {
    try {
      setIsRendering(true);
      setError(null);
      const url = await renderScene(scene);
      setVideoUrl(url);
    } catch (error) {
      console.error('Error rendering video:', error);
      setError('Failed to render video. Please try again.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Preview Area */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg shadow-xl overflow-hidden">
        <div className="aspect-video bg-black relative">
          {scene.characters.map((charPos) => {
            const character = characters.find(c => c.id === charPos.characterId);
            if (!character) return null;
            return (
              <AnimatedCharacter
                key={charPos.characterId}
                character={character}
                currentTime={currentTime}
                actions={scene.actions.filter(a => a.characterId === charPos.characterId)}
                sceneStartTime={0}
              />
            );
          })}
        </div>
        
        {/* Timeline control */}
        <div className="p-4">
          <SceneTimeline
            scene={scene}
            duration={scene.duration}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            onSceneUpdate={(updatedScene) => {
              setScene(prev => ({
                ...prev,
                ...updatedScene
              }));
            }}
          />
        </div>
      </div>

      {/* Character List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map(char => (
          <div
            key={char.id}
            className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-purple-50">
                <Image
                  src={char.imageUrl}
                  alt={char.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-purple-900">{char.name}</h3>
                <p className="text-sm text-purple-600">{char.features.expression}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        {error && (
          <div className="flex-1 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <button
          onClick={handleRender}
          disabled={isRendering || scene.characters.length === 0}
          className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isRendering || scene.characters.length === 0
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
          } text-white`}
        >
          <FontAwesomeIcon icon={faVideo} className={`mr-2 ${isRendering ? 'animate-pulse' : ''}`} />
          {isRendering ? 'Rendering...' : 'Render Video'}
        </button>
      </div>

      {/* Rendered Video */}
      {videoUrl && (
        <div className="bg-white rounded-lg border border-purple-100 shadow-lg overflow-hidden">
          <div className="border-b border-purple-100 p-4">
            <h3 className="text-lg font-semibold text-purple-900">Rendered Video</h3>
          </div>
          <div className="p-6 space-y-4">
            <video
              src={videoUrl}
              controls
              className="w-full aspect-video bg-black rounded-lg"
            />
            <a
              href={videoUrl}
              download="cartoon.mp4"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Download Video
            </a>
          </div>
        </div>
      )}
    </div>
  );
}