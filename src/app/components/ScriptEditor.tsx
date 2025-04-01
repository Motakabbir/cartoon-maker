'use client';

import { useState, useEffect, useCallback } from 'react';
import { Script, SceneScript, Dialogue, Action, Scene } from '../types/animation';
import { Character } from '../types/character';
import VideoComposer from './VideoComposer';
import CharacterCreator from './CharacterCreator';
import VoiceOverGenerator from './VoiceOverGenerator';
import SceneTimeline from './SceneTimeline';
import { generateBackground } from '../services/aiService';

export default function ScriptEditor() {
  const [script, setScript] = useState<Script>({
    id: Date.now().toString(),
    scenes: [],
    duration: 0,
    resolution: { width: 1920, height: 1080 },
    fps: 30
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const addScene = () => {
    const newScene: SceneScript = {
      sceneId: Date.now().toString(),
      duration: 5,
      dialogues: [],
      actions: [],
      background: '',
      lighting: 'natural',
      timeOfDay: 'day',
      characters: [],
      weather: 'clear'
    };
    setScript(prev => ({ ...prev, scenes: [...prev.scenes, newScene] }));
  };

  const addDialogue = (sceneIndex: number) => {
    const newDialogue: Dialogue = {
      characterId: '',
      text: '',
      emotion: 'neutral',
      voiceSettings: {
        voice: 'default',
        pitch: 1,
        speed: 1
      }
    };
    const updatedScenes = [...script.scenes];
    updatedScenes[sceneIndex].dialogues.push(newDialogue);
    setScript(prev => ({ ...prev, scenes: updatedScenes }));
  };

  const addAction = (sceneIndex: number) => {
    const newAction: Action = {
      characterId: '',
      type: 'move',
      params: {},
      duration: 1,
      startTime: 0  // Add this required property
    };
    const updatedScenes = [...script.scenes];
    updatedScenes[sceneIndex].actions.push(newAction);
    setScript(prev => ({ ...prev, scenes: updatedScenes }));
  };

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleCharacterCreated = (character: Character) => {
    setCharacters(prev => [...prev, character]);
    setShowCharacterCreator(false);
  };

  useEffect(() => {
    let animationFrame: number;
    const updateTime = (timestamp: number) => {
      if (isPlaying) {
        setCurrentTime(time => {
          const newTime = time + (playbackRate * (1 / 60));
          const totalDuration = script.scenes.reduce((acc, scene) => acc + scene.duration, 0);
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return newTime;
        });
        animationFrame = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, playbackRate, script.scenes]);

  // Update the script state with the current time and total duration
  useEffect(() => {
    const totalDuration = script.scenes.reduce((acc, scene) => acc + scene.duration, 0);
    setScript(prev => ({
      ...prev,
      duration: totalDuration
    }));
  }, [script.scenes]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">AI Video Creator</h1>
        <button
          onClick={() => setShowCharacterCreator(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Create Character
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Script Editor Panel */}
        <div className="col-span-8 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Script Editor</h2>
            <button
              onClick={addScene}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Scene
            </button>
          </div>

          <div className="space-y-4">
            {script.scenes.map((scene, sceneIndex) => (
              <div 
                key={scene.sceneId} 
                className={`border rounded p-4 ${selectedSceneIndex === sceneIndex ? 'border-blue-500' : ''}`}
                onClick={() => setSelectedSceneIndex(sceneIndex)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Scene {sceneIndex + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addDialogue(sceneIndex)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Add Dialogue
                    </button>
                    <button
                      onClick={() => addAction(sceneIndex)}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                    >
                      Add Action
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Background</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Describe the scene background..."
                        className="w-full p-2 border rounded"
                        value={scene.background}
                        onChange={(e) => {
                          const updatedScenes = [...script.scenes];
                          updatedScenes[sceneIndex].background = e.target.value;
                          setScript(prev => ({ ...prev, scenes: updatedScenes }));
                        }}
                      />
                      <div className="flex gap-2">
                        <select
                          className="p-2 border rounded flex-1"
                          value={scene.timeOfDay}
                          onChange={(e) => {
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].timeOfDay = e.target.value as any;
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          }}
                        >
                          <option value="day">Day</option>
                          <option value="night">Night</option>
                          <option value="dawn">Dawn</option>
                          <option value="dusk">Dusk</option>
                        </select>
                        <select
                          className="p-2 border rounded flex-1"
                          value={scene.weather}
                          onChange={(e) => {
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].weather = e.target.value as any;
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          }}
                        >
                          <option value="clear">Clear</option>
                          <option value="rain">Rain</option>
                          <option value="snow">Snow</option>
                          <option value="cloudy">Cloudy</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const generatedBackground = await generateBackground(
                              scene.background,
                              scene.timeOfDay,
                              scene.weather
                            );
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].backgroundUrl = generatedBackground;
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          } catch (error) {
                            console.error('Error generating background:', error);
                          }
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Generate Background
                      </button>
                      {scene.backgroundUrl && (
                        <div className="relative h-32 rounded overflow-hidden">
                          <img
                            src={scene.backgroundUrl}
                            alt="Scene background"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2 border rounded"
                      value={scene.duration}
                      onChange={(e) => {
                        const updatedScenes = [...script.scenes];
                        updatedScenes[sceneIndex].duration = Number(e.target.value);
                        setScript(prev => ({ ...prev, scenes: updatedScenes }));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Dialogues</h4>
                    {scene.dialogues.map((dialogue, dialogueIndex) => (
                      <div key={dialogueIndex} className="mb-2 p-3 bg-gray-50 rounded">
                        <select
                          className="w-full p-2 mb-2 border rounded"
                          value={dialogue.characterId}
                          onChange={(e) => {
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].dialogues[dialogueIndex].characterId = e.target.value;
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          }}
                        >
                          <option value="">Select Character</option>
                          {characters.map(char => (
                            <option key={char.id} value={char.id}>{char.name}</option>
                          ))}
                        </select>
                        
                        <textarea
                          placeholder="Enter dialogue..."
                          className="w-full p-2 border rounded mb-2"
                          value={dialogue.text}
                          onChange={(e) => {
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].dialogues[dialogueIndex].text = e.target.value;
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          }}
                        />

                        <select
                          className="w-full p-2 border rounded"
                          value={dialogue.emotion}
                          onChange={(e) => {
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].dialogues[dialogueIndex].emotion = e.target.value as 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          }}
                        >
                          <option value="neutral">Neutral</option>
                          <option value="happy">Happy</option>
                          <option value="sad">Sad</option>
                          <option value="angry">Angry</option>
                          <option value="surprised">Surprised</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Actions</h4>
                    {scene.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="mb-2 p-3 bg-gray-50 rounded">
                        <select
                          className="w-full p-2 mb-2 border rounded"
                          value={action.characterId}
                          onChange={(e) => {
                            const updatedScenes = [...script.scenes];
                            updatedScenes[sceneIndex].actions[actionIndex].characterId = e.target.value;
                            setScript(prev => ({ ...prev, scenes: updatedScenes }));
                          }}
                        >
                          <option value="">Select Character</option>
                          {characters.map(char => (
                            <option key={char.id} value={char.id}>{char.name}</option>
                          ))}
                        </select>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="p-2 border rounded"
                            value={action.type}
                            onChange={(e) => {
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].actions[actionIndex].type = e.target.value as any;
                              setScript(prev => ({ ...prev, scenes: updatedScenes }));
                            }}
                          >
                            <option value="move">Move</option>
                            <option value="rotate">Rotate</option>
                            <option value="gesture">Gesture</option>
                            <option value="expression">Expression</option>
                          </select>

                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder="Duration (s)"
                            className="p-2 border rounded"
                            value={action.duration}
                            onChange={(e) => {
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].actions[actionIndex].duration = Number(e.target.value);
                              setScript(prev => ({ ...prev, scenes: updatedScenes }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Panel */}
        <div className="col-span-12">
          <SceneTimeline
            scene={selectedSceneIndex !== null ? {
              ...script.scenes[selectedSceneIndex],
              id: script.scenes[selectedSceneIndex].sceneId // Add id property
            } : {
              id: '',
              sceneId: '',
              duration: 0,
              background: '',
              lighting: 'natural',
              timeOfDay: 'day',
              characters: [],
              dialogues: [],
              actions: []
            }}
            duration={selectedSceneIndex !== null ? script.scenes[selectedSceneIndex].duration : 0}
            currentTime={currentTime}
            onTimeUpdate={handleTimeChange}
            onDialogueAdd={(dialogue) => {
              if (selectedSceneIndex !== null) {
                const updatedScenes = [...script.scenes];
                updatedScenes[selectedSceneIndex].dialogues.push(dialogue);
                setScript(prev => ({ ...prev, scenes: updatedScenes }));
              }
            }}
            onActionAdd={(action) => {
              if (selectedSceneIndex !== null) {
                const updatedScenes = [...script.scenes];
                updatedScenes[selectedSceneIndex].actions.push(action);
                setScript(prev => ({ ...prev, scenes: updatedScenes }));
              }
            }}
            onDialogueEdit={(index, dialogue) => {
              if (selectedSceneIndex !== null) {
                const updatedScenes = [...script.scenes];
                updatedScenes[selectedSceneIndex].dialogues[index] = dialogue;
                setScript(prev => ({ ...prev, scenes: updatedScenes }));
              }
            }}
            onActionEdit={(index, action) => {
              if (selectedSceneIndex !== null) {
                const updatedScenes = [...script.scenes];
                updatedScenes[selectedSceneIndex].actions[index] = action;
                setScript(prev => ({ ...prev, scenes: updatedScenes }));
              }
            }}
            onDialogueDelete={(index) => {
              if (selectedSceneIndex !== null) {
                const updatedScenes = [...script.scenes];
                updatedScenes[selectedSceneIndex].dialogues.splice(index, 1);
                setScript(prev => ({ ...prev, scenes: updatedScenes }));
              }
            }}
            onActionDelete={(index) => {
              if (selectedSceneIndex !== null) {
                const updatedScenes = [...script.scenes];
                updatedScenes[selectedSceneIndex].actions.splice(index, 1);
                setScript(prev => ({ ...prev, scenes: updatedScenes }));
              }
            }}
          />
        </div>

        {/* Preview Panel */}
        <div className="col-span-4 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="p-2 border rounded"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Character Creator Modal */}
      {showCharacterCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Character</h2>
                <button
                  onClick={() => setShowCharacterCreator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <CharacterCreator onCharacterCreated={handleCharacterCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}