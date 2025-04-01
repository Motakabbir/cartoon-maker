'use client';

import { useState, useEffect, useCallback } from 'react';
import { Script, SceneScript, Dialogue, Action, Scene, Vector3, ActionType, Emotion, ActionParams, VoiceSettings } from '../types/animation';
import { Character } from '../types/character';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPlay, faCog, faFilm, faComments, faRunning, faSun, faCloud, faClock, faImage, faMagic, faUser, faUserPlus} from '@fortawesome/free-solid-svg-icons';
import VideoComposer from './VideoComposer';
import CharacterCreator from './CharacterCreator';
import VoiceOverGenerator from './VoiceOverGenerator';
import SceneTimeline from './SceneTimeline';
import { generateBackground } from '../services/aiService';
import { initializeNewScript } from '@/app/actions/script-actions';
import { addScene, addAction, removeAction, addDialogue, removeDialogue, updateSceneData } from '@/app/actions/scene-actions';

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

const convertDbCharacterToAppCharacter = (dbCharacter: any): Character => ({
  id: dbCharacter.id,
  name: dbCharacter.name,
  features: JSON.parse(dbCharacter.model).features,
  imageUrl: JSON.parse(dbCharacter.model).imageUrl,
  animation: {
    currentPose: JSON.parse(dbCharacter.model).animation?.currentPose || 'idle',
    currentExpression: JSON.parse(dbCharacter.model).animation?.currentExpression || 'neutral'
  }
});

const convertDbSceneToAppScene = (dbScene: any): SceneScript => ({
  sceneId: dbScene.id,
  duration: dbScene.duration,
  dialogues: dbScene.dialogues?.map((d: any) => ({
    id: d.id,
    characterId: d.characterId,
    text: d.text,
    emotion: d.emotion,
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
  lighting: dbScene.lighting,
  timeOfDay: dbScene.timeOfDay,
  weather: dbScene.weather,
  backgroundUrl: dbScene.backgroundUrl,
  characters: dbScene.characters?.map((c: any) => ({
    characterId: c.characterId,
    position: parseJsonValue(c.position),
    rotation: parseJsonValue(c.rotation),
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
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const [generatingBackground, setGeneratingBackground] = useState<Record<number, boolean>>({});
  const [backgroundErrors, setBackgroundErrors] = useState<Record<number, string>>({});
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

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Update SceneTimeline integration
  const handleSceneUpdate = async (updatedScene: Partial<SceneScript>) => {
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

    if (updatedScene.background !== undefined || 
        updatedScene.lighting !== undefined || 
        updatedScene.timeOfDay !== undefined || 
        updatedScene.weather !== undefined || 
        updatedScene.duration !== undefined) {
      try {
        await updateSceneData(updatedScene.sceneId!, {
          background: updatedScene.background,
          lighting: updatedScene.lighting,
          timeOfDay: updatedScene.timeOfDay,
          weather: updatedScene.weather,
          duration: updatedScene.duration
        });
      } catch (error) {
        console.error('Failed to update scene:', error);
      }
    }
  };

  const addSceneToScript = async () => {
    try {
      const newScene = await addScene({
        scriptId: script.id,
        background: '',
        lighting: 'natural',
        timeOfDay: 'day',
        weather: 'clear',
        duration: 5.0,
        order: script.scenes.length + 1
      });

      if (newScene) {
        const newSceneScript = convertDbSceneToAppScene(newScene);
        setScript(prev => ({
          ...prev,
          scenes: [...prev.scenes, newSceneScript]
        }));
        setSelectedSceneIndex(script.scenes.length);
      }
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const handleGenerateBackground = async (sceneIndex: number) => {
    const scene = script.scenes[sceneIndex];
    setGeneratingBackground(prev => ({ ...prev, [sceneIndex]: true }));
    setBackgroundErrors(prev => ({ ...prev, [sceneIndex]: '' }));
    
    try {
      const backgroundUrl = await generateBackground(
        scene.background,
        scene.timeOfDay,
        scene.weather
      );

      const updatedScenes = [...script.scenes];
      updatedScenes[sceneIndex] = {
        ...scene,
        backgroundUrl: backgroundUrl
      };

      setScript(prev => ({
        ...prev,
        scenes: updatedScenes
      }));

      await updateSceneData(scene.sceneId, {
        background: scene.background,
        timeOfDay: scene.timeOfDay,
        weather: scene.weather,
        backgroundUrl: backgroundUrl
      });
    } catch (error) {
      console.error('Failed to generate background:', error);
      setBackgroundErrors(prev => ({
        ...prev,
        [sceneIndex]: 'Failed to generate background'
      }));
    } finally {
      setGeneratingBackground(prev => ({ ...prev, [sceneIndex]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faFilm} className="text-purple-600" />
              Script Editor
            </h1>
            <div className="flex items-center gap-4">
              {isSaving && <span className="text-purple-500 text-sm">Saving...</span>}
              {saveError && <span className="text-red-500 text-sm">{saveError}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content - Scene Editor */}
          <div className="col-span-8">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-purple-900">Scenes</h2>
                <button
                  onClick={addSceneToScript}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Scene
                </button>
              </div>

              <div className="space-y-6">
                {script.scenes.map((scene, sceneIndex) => (
                  <div 
                    key={scene.sceneId} 
                    className={`border border-purple-100 rounded-lg p-4 transition-all duration-200 ${
                      selectedSceneIndex === sceneIndex
                        ? 'bg-purple-50 border-purple-300 shadow-md'
                        : 'hover:border-purple-200 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedSceneIndex(sceneIndex)}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilm} className="text-purple-600" />
                        Scene {sceneIndex + 1}
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Background Section */}
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <label className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                          <FontAwesomeIcon icon={faImage} />
                          Background
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Describe the scene background..."
                            className="flex-1 p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={scene.background}
                            onChange={(e) => {
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].background = e.target.value;
                              setScript(prev => ({
                                ...prev,
                                scenes: updatedScenes
                              }));
                            }}
                          />
                          <button
                            onClick={() => handleGenerateBackground(sceneIndex)}
                            className={`px-4 py-2 text-white rounded-lg transition-all duration-200 flex items-center gap-2 min-w-[160px] ${
                              generatingBackground[sceneIndex]
                                ? 'bg-purple-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                            disabled={generatingBackground[sceneIndex]}
                          >
                            {generatingBackground[sceneIndex] ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faMagic} />
                                Generate
                              </>
                            )}
                          </button>
                        </div>
                        {backgroundErrors[sceneIndex] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            {backgroundErrors[sceneIndex]}
                          </p>
                        )}

                        {scene.backgroundUrl && (
                          <div className="mt-4 relative h-48 rounded-lg overflow-hidden group">
                            <img
                              src={scene.backgroundUrl}
                              alt="Scene background"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                      </div>

                      {/* Scene Settings Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-purple-100">
                          <label className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faSun} className="text-purple-600" />
                            Time of Day
                          </label>
                          <select
                            className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={scene.timeOfDay}
                            onChange={(e) => {
                              const value = e.target.value as Scene['timeOfDay'];
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].timeOfDay = value;
                              setScript(prev => ({
                                ...prev,
                                scenes: updatedScenes
                              }));
                            }}
                          >
                            <option value="day">Day</option>
                            <option value="night">Night</option>
                            <option value="sunset">Sunset</option>
                            <option value="sunrise">Sunrise</option>
                          </select>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-purple-100">
                          <label className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCloud} className="text-purple-600" />
                            Weather
                          </label>
                          <select
                            className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={scene.weather}
                            onChange={(e) => {
                              const value = e.target.value as SceneScript['weather'];
                              const updatedScenes = [...script.scenes];
                              updatedScenes[sceneIndex].weather = value;
                              setScript(prev => ({
                                ...prev,
                                scenes: updatedScenes
                              }));
                            }}
                          >
                            <option value="clear">Clear</option>
                            <option value="cloudy">Cloudy</option>
                            <option value="rain">Rain</option>
                            <option value="snow">Snow</option>
                            <option value="foggy">Foggy</option>
                            <option value="stormy">Stormy</option>
                          </select>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-purple-100">
                          <label className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="text-purple-600" />
                            Duration
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="60"
                              step="0.1"
                              className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                              value={scene.duration}
                              onChange={(e) => {
                                const updatedScenes = [...script.scenes];
                                updatedScenes[sceneIndex].duration = Number(e.target.value);
                                setScript(prev => ({
                                  ...prev,
                                  scenes: updatedScenes
                                }));
                              }}
                            />
                            <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded min-w-[60px] text-center">
                              {scene.duration.toFixed(1)}s
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <SceneTimeline
                          scene={{
                            ...scene,
                            id: scene.sceneId
                          }}
                          duration={scene.duration}
                          currentTime={currentTime}
                          onTimeUpdate={handleTimeChange}
                          onSceneUpdate={(updatedScene) => handleSceneUpdate({
                            ...updatedScene,
                            sceneId: scene.sceneId
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Character List */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-purple-600" />
                Characters
              </h2>
              {characters.length === 0 ? (
                <div className="text-center py-8 text-purple-400">
                  <FontAwesomeIcon icon={faUserPlus} className="text-4xl mb-2" />
                  <p>No characters created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {characters.map(char => (
                    <div
                      key={char.id}
                      className="bg-white p-4 rounded-lg border border-purple-100 hover:shadow-md transition-shadow"
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
                          <p className="text-sm text-purple-600">
                            {char.features.expression}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}