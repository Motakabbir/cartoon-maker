'use client';

import { useState, useEffect, useCallback } from 'react';
import { Script, SceneScript, Dialogue, Action, Scene, Vector3, ActionType, Emotion } from '../types/animation';
import { Character } from '../types/character';
import VideoComposer from './VideoComposer';
import CharacterCreator from './CharacterCreator';
import VoiceOverGenerator from './VoiceOverGenerator';
import SceneTimeline from './SceneTimeline';
import { generateBackground } from '../services/aiService';
import { initializeNewScript } from '@/app/actions/script-actions';
import { createScene, createDialogue, createAction, updateScript, getSceneWithDetails } from '@/lib/database-helpers';

// Type conversion helpers
const parseJsonValue = <T,>(value: any): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }
  return value as T;
};

interface DbCharacterModel {
  features?: {
    face?: {
      eyes?: string;
      nose?: string;
      mouth?: string;
      hairstyle?: string;
      skinTone?: string;
    };
    outfit?: {
      type?: string;
      color?: string;
      accessories?: string[];
    };
    expression?: Emotion;
  };
  imageUrl?: string;
  animation?: {
    currentPose?: string;
    currentExpression?: Emotion;
  };
}

const convertDbCharacterToAppCharacter = (dbCharacter: any): Character => {
  const model = parseJsonValue<DbCharacterModel>(dbCharacter.model) || {};
  return {
    id: dbCharacter.id,
    name: dbCharacter.name,
    imageUrl: model.imageUrl || '',
    features: {
      face: {
        eyes: model.features?.face?.eyes || 'normal',
        nose: model.features?.face?.nose || 'normal',
        mouth: model.features?.face?.mouth || 'neutral',
        hairstyle: model.features?.face?.hairstyle || 'normal',
        skinTone: model.features?.face?.skinTone || 'medium'
      },
      outfit: {
        type: model.features?.outfit?.type || 'casual',
        color: model.features?.outfit?.color || 'neutral',
        accessories: model.features?.outfit?.accessories || []
      },
      expression: model.features?.expression || 'neutral'
    },
    animation: {
      currentPose: model.animation?.currentPose || 'idle',
      currentExpression: model.animation?.currentExpression || 'neutral'
    }
  };
};

const convertDbSceneToAppScene = (dbScene: any): SceneScript => ({
  sceneId: dbScene.id,
  duration: dbScene.duration,
  dialogues: dbScene.dialogues?.map((d: any) => ({
    id: d.id,
    characterId: d.characterId,
    text: d.text,
    emotion: d.emotion as Emotion,
    voiceSettings: parseJsonValue(d.voiceSettings),
    startTime: d.startTime ?? undefined,
    duration: d.duration ?? undefined
  })) || [],
  actions: dbScene.actions?.map((a: any) => ({
    id: a.id,
    characterId: a.characterId,
    type: a.type as ActionType,
    params: parseJsonValue(a.params),
    startTime: a.startTime,
    duration: a.duration
  })) || [],
  background: dbScene.background,
  lighting: dbScene.lighting as 'natural' | 'studio' | 'dramatic' | 'dark',
  timeOfDay: dbScene.timeOfDay as 'day' | 'night' | 'sunset' | 'sunrise',
  weather: dbScene.weather as 'clear' | 'rain' | 'snow' | 'cloudy',
  backgroundUrl: dbScene.backgroundUrl,
  characters: dbScene.characters?.map((c: any) => ({
    characterId: c.characterId,
    position: parseJsonValue<Vector3>(c.position),
    rotation: parseJsonValue<Vector3>(c.rotation),
    scale: c.scale
  })) || []
});

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
  const [generatingBackground, setGeneratingBackground] = useState<{ [key: string]: boolean }>({});
  const [backgroundErrors, setBackgroundErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing characters and initialize script
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        const { script: newScript, characters: existingCharacters } = await initializeNewScript();
        setScript(newScript);
        setCharacters(existingCharacters.map(convertDbCharacterToAppCharacter));
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        setSaveError('Failed to initialize script');
      }
    };
    
    initializeEditor();
  }, []);

  const addScene = async () => {
    try {
      const newScene = await createScene({
        scriptId: script.id,
        background: '',
        lighting: 'natural',
        timeOfDay: 'day',
        weather: 'clear',
        duration: 5.0,
        order: script.scenes.length + 1
      });

      const sceneWithDetails = await getSceneWithDetails(newScene.id);
      
      if (sceneWithDetails) {
        const newSceneScript = convertDbSceneToAppScene(sceneWithDetails);
        setScript((prev: Script) => ({
          ...prev,
          scenes: [...prev.scenes, newSceneScript]
        }));
      }
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  // Update the handleTimeChange to work with scene IDs
  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Update SceneTimeline integration
  const handleSceneUpdate = async (updatedScene: Scene) => {
    if (selectedSceneIndex === null) return;

    const updatedScenes = [...script.scenes];
    updatedScenes[selectedSceneIndex] = {
      ...updatedScenes[selectedSceneIndex],
      ...updatedScene
    };

    setScript(prev => ({
      ...prev,
      scenes: updatedScenes
    }));
  };

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
          const totalDuration = script.scenes.reduce((acc: number, scene: SceneScript) => acc + scene.duration, 0);
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
    const totalDuration = script.scenes.reduce((acc: number, scene: SceneScript) => acc + scene.duration, 0);
    setScript((prev: Script) => ({
      ...prev,
      duration: totalDuration
    }));
  }, [script.scenes]);

  const addDialogue = async (sceneIndex: number) => {
    const newDialogue = {
      characterId: '',
      text: '',
      emotion: 'neutral' as Emotion,
      voiceSettings: {
        voice: 'default',
        pitch: 1,
        speed: 1
      }
    };

    try {
      const dialogue = await createDialogue({
        sceneId: script.scenes[sceneIndex].sceneId,
        characterId: newDialogue.characterId,
        text: newDialogue.text,
        emotion: newDialogue.emotion,
        voiceSettings: newDialogue.voiceSettings
      });

      const convertedDialogue: Dialogue = {
        id: dialogue.id,
        characterId: dialogue.characterId,
        text: dialogue.text,
        emotion: dialogue.emotion as Emotion,
        voiceSettings: parseJsonValue(dialogue.voiceSettings),
        startTime: dialogue.startTime ?? undefined,
        duration: dialogue.duration ?? undefined
      };

      const updatedScenes = [...script.scenes];
      updatedScenes[sceneIndex].dialogues.push(convertedDialogue);
      setScript(prev => ({
        ...prev,
        scenes: updatedScenes
      }));
    } catch (error) {
      console.error('Failed to add dialogue:', error);
    }
  };

  const addAction = async (sceneIndex: number) => {
    const newAction = {
      characterId: '',
      type: 'move' as ActionType,
      params: {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 0 }
      },
      startTime: 0,
      duration: 1
    };

    try {
      const action = await createAction({
        sceneId: script.scenes[sceneIndex].sceneId,
        characterId: newAction.characterId,
        type: newAction.type,
        params: newAction.params,
        startTime: newAction.startTime,
        duration: newAction.duration
      });

      const convertedAction: Action = {
        id: action.id,
        characterId: action.characterId,
        type: action.type as ActionType,
        params: parseJsonValue(action.params),
        startTime: action.startTime,
        duration: action.duration
      };

      const updatedScenes = [...script.scenes];
      updatedScenes[sceneIndex].actions.push(convertedAction);
      setScript(prev => ({
        ...prev,
        scenes: updatedScenes
      }));
    } catch (error) {
      console.error('Failed to add action:', error);
    }
  };

  const handleGenerateBackground = async (sceneIndex: number, scene: SceneScript) => {
    setGeneratingBackground(prev => ({ ...prev, [sceneIndex]: true }));
    setBackgroundErrors(prev => ({ ...prev, [sceneIndex]: '' }));
    
    try {
      const generatedBackground = await generateBackground(
        scene.background,
        scene.timeOfDay,
        scene.weather
      );

      const updatedScenes = [...script.scenes];
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        backgroundUrl: generatedBackground
      };
      setScript(prev => ({ ...prev, scenes: updatedScenes }));
      
    } catch (error) {
      console.error('Error generating background:', error);
      setBackgroundErrors(prev => ({
        ...prev,
        [sceneIndex]: 'Failed to generate background. Please try again.'
      }));
    } finally {
      setGeneratingBackground(prev => ({ ...prev, [sceneIndex]: false }));
    }
  };

  // Auto-save effect
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (!script.id || isSaving) return;
      
      setIsSaving(true);
      setSaveError(null);
      
      try {
        await updateScript(script.id, {
          title: script.title || 'Untitled Script',
          fps: script.fps,
          resolution: script.resolution
        });
      } catch (error) {
        console.error('Failed to auto-save script:', error);
        setSaveError('Failed to save changes. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [script, isSaving]);

  // Add save status indicator to the UI
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">AI Video Creator</h1>
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="text-gray-500 text-sm">Saving...</span>
          )}
          {saveError && (
            <span className="text-red-500 text-sm">{saveError}</span>
          )}
          <button
            onClick={() => setShowCharacterCreator(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Create Character
          </button>
        </div>
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
                        onClick={() => handleGenerateBackground(sceneIndex, scene)}
                        disabled={generatingBackground[sceneIndex] || !scene.background}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {generatingBackground[sceneIndex] ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Generating...
                          </span>
                        ) : (
                          'Generate Background'
                        )}
                      </button>
                      {backgroundErrors[sceneIndex] && (
                        <p className="text-red-500 text-sm mt-1">{backgroundErrors[sceneIndex]}</p>
                      )}
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
                      <div key={dialogueIndex} className="mb-2 p-3 bg-gray-50 rounded flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <select
                            className="w-full p-2 mb-2 border rounded mr-2"
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
                          <button
                            onClick={() => {
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].dialogues.splice(dialogueIndex, 1);
                              setScript(prev => ({ ...prev, scenes: updatedScenes }));
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>

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
                      <div key={actionIndex} className="mb-2 p-3 bg-gray-50 rounded flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <select
                            className="w-full p-2 mb-2 border rounded mr-2"
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
                          <button
                            onClick={() => {
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].actions.splice(actionIndex, 1);
                              setScript(prev => ({ ...prev, scenes: updatedScenes }));
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>

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
              id: script.scenes[selectedSceneIndex].sceneId
            } : {
              id: '',
              background: '',
              lighting: 'natural',
              timeOfDay: 'day',
              characters: [],
              dialogues: [],
              actions: [],
              duration: 0
            }}
            duration={selectedSceneIndex !== null ? script.scenes[selectedSceneIndex].duration : 0}
            currentTime={currentTime}
            onTimeUpdate={handleTimeChange}
            onSceneUpdate={handleSceneUpdate}
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