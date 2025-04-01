'use client';

import { useState, useCallback } from 'react';
import { Scene, Dialogue, Action } from '../types/animation';
import { Character } from '../types/character';
import CharacterCreator from './CharacterCreator';
import SceneTimeline from './SceneTimeline';
import ScriptEditor from './ScriptEditor';
import AnimatedCharacter from './AnimatedCharacter';
import { renderScene } from '../utils/renderScene';

export default function VideoComposer() {
  const [scene, setScene] = useState<Scene>({
    id: 'main',
    background: 'default',
    lighting: 'natural',
    timeOfDay: 'day',
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
      const url = await renderScene(scene);
      setVideoUrl(url);
    } catch (error) {
      console.error('Error rendering video:', error);
      // TODO: Add proper error handling UI
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <CharacterCreator onCharacterCreated={handleCharacterCreated} />
      
      <div className="flex gap-4">
        <div className="flex-1 aspect-video bg-gray-900 relative">
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
        
        <div className="w-64 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Characters</h3>
          <ul className="space-y-2">
            {characters.map(char => (
              <li key={char.id} className="text-sm">
                {char.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ScriptEditor />

      <SceneTimeline
        scene={scene}
        duration={scene.duration}
        currentTime={currentTime}
        onTimeUpdate={handleTimeUpdate}
        onDialogueAdd={handleDialogueAdd}
        onActionAdd={handleActionAdd}
        onDialogueEdit={handleDialogueEdit}
        onActionEdit={handleActionEdit}
        onDialogueDelete={handleDialogueDelete}
        onActionDelete={handleActionDelete}
      />

      <div className="flex justify-end gap-4">
        <button
          onClick={handleRender}
          disabled={isRendering || scene.characters.length === 0}
          className={`px-4 py-2 text-white rounded ${
            isRendering || scene.characters.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {isRendering ? 'Rendering...' : 'Render Video'}
        </button>
      </div>

      {videoUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Rendered Video</h3>
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video bg-black"
          />
          <a
            href={videoUrl}
            download="cartoon.mp4"
            className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}