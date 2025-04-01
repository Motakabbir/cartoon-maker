'use client';

import { useState, useEffect, useCallback } from 'react';
import { Scene, Dialogue, Action } from '../types/animation';
import { updateDialogue, deleteDialogue, updateAction, deleteAction, createDialogue, createAction } from '@/lib/database-helpers';

interface SceneTimelineProps {
  scene: Scene;
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSceneUpdate: (updatedScene: Scene) => void;
}

export default function SceneTimeline({
  scene,
  duration,
  currentTime,
  onTimeUpdate,
  onSceneUpdate
}: SceneTimelineProps) {
  const [selectedType, setSelectedType] = useState<'dialogue' | 'action' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const timeline = document.getElementById('timeline');
        if (timeline) {
          const rect = timeline.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));
          onTimeUpdate(newTime);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, duration, onTimeUpdate]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    const timeline = document.getElementById('timeline');
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));
      onTimeUpdate(newTime);
    }
  };

  const handleMarkerMouseDown = (
    e: React.MouseEvent,
    type: 'dialogue' | 'action',
    index: number
  ) => {
    e.stopPropagation();
    setSelectedType(type);
    setSelectedIndex(index);
    setIsDragging(true);
  };

  const secondsToTimecode = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const getMarkerStyle = (startTime: number, duration: number) => {
    const left = (startTime / scene.duration) * 100;
    const width = (duration / scene.duration) * 100;
    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  const handleDialogueEdit = async (index: number, dialogue: Dialogue) => {
    if (!dialogue.id) return;
    setIsUpdating(true);
    
    try {
      await updateDialogue(dialogue.id, {
        text: dialogue.text,
        emotion: dialogue.emotion,
        voiceSettings: dialogue.voiceSettings as unknown as Record<string, unknown>,
        startTime: dialogue.startTime ?? null,
        duration: dialogue.duration ?? null
      });

      const updatedDialogues = [...scene.dialogues];
      updatedDialogues[index] = dialogue;
      onSceneUpdate({
        ...scene,
        dialogues: updatedDialogues
      });
    } catch (error) {
      console.error('Failed to update dialogue:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDialogueDelete = async (index: number) => {
    const dialogueToDelete = scene.dialogues[index];
    if (!dialogueToDelete?.id) return;

    setIsUpdating(true);
    try {
      await deleteDialogue(dialogueToDelete.id);
      
      const updatedDialogues = scene.dialogues.filter((_, i) => i !== index);
      onSceneUpdate({
        ...scene,
        dialogues: updatedDialogues
      });
      setSelectedType(null);
      setSelectedIndex(null);
    } catch (error) {
      console.error('Failed to delete dialogue:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionEdit = async (index: number, action: Action) => {
    if (!action.id) return;
    setIsUpdating(true);
    
    try {
      await updateAction(action.id, {
        type: action.type,
        params: action.params as unknown as Record<string, unknown>,
        startTime: action.startTime,
        duration: action.duration
      });

      const updatedActions = [...scene.actions];
      updatedActions[index] = action;
      onSceneUpdate({
        ...scene,
        actions: updatedActions
      });
    } catch (error) {
      console.error('Failed to update action:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionDelete = async (index: number) => {
    const actionToDelete = scene.actions[index];
    if (!actionToDelete?.id) return;

    setIsUpdating(true);
    try {
      await deleteAction(actionToDelete.id);
      
      const updatedActions = scene.actions.filter((_, i) => i !== index);
      onSceneUpdate({
        ...scene,
        actions: updatedActions
      });
      setSelectedType(null);
      setSelectedIndex(null);
    } catch (error) {
      console.error('Failed to delete action:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDialogueAdd = async (dialogue: Dialogue) => {
    setIsUpdating(true);
    try {
      const createdDialogue = await createDialogue({
        sceneId: scene.id,
        characterId: dialogue.characterId,
        text: dialogue.text,
        emotion: dialogue.emotion,
        voiceSettings: dialogue.voiceSettings as unknown as Record<string, unknown>,
        startTime: dialogue.startTime ?? null,
        duration: dialogue.duration ?? null
      });

      onSceneUpdate({
        ...scene,
        dialogues: [...scene.dialogues, { ...dialogue, id: createdDialogue.id }]
      });
    } catch (error) {
      console.error('Failed to add dialogue:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionAdd = async (action: Action) => {
    setIsUpdating(true);
    try {
      const createdAction = await createAction({
        sceneId: scene.id,
        characterId: action.characterId,
        type: action.type,
        params: action.params as unknown as Record<string, unknown>,
        startTime: action.startTime,
        duration: action.duration
      });

      onSceneUpdate({
        ...scene,
        actions: [...scene.actions, { ...action, id: createdAction.id }]
      });
    } catch (error) {
      console.error('Failed to add action:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            const newDialogue: Dialogue = {
              characterId: scene.characters[0]?.characterId || '',
              text: 'New dialogue',
              emotion: 'neutral',
              voiceSettings: {
                voice: 'default',
                pitch: 1,
                speed: 1
              },
              startTime: currentTime,
              duration: 2
            };
            handleDialogueAdd(newDialogue);
          }}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Dialogue
        </button>
        <button
          onClick={() => {
            const newAction: Action = {
              characterId: scene.characters[0]?.characterId || '',
              type: 'move',
              params: {
                from: { x: 0, y: 0, z: 0 },
                to: { x: 1, y: 0, z: 0 },
                easing: 'linear'
              },
              startTime: currentTime,
              duration: 1
            };
            handleActionAdd(newAction);
          }}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Action
        </button>
        <span className="ml-auto font-mono">
          {secondsToTimecode(currentTime)} / {secondsToTimecode(duration)}
        </span>
      </div>

      <div
        id="timeline"
        className="timeline-track"
        onClick={handleTimelineClick}
      >
        {scene.dialogues.map((dialogue, index) => (
          <div
            key={`dialogue-${index}`}
            className="timeline-marker bg-blue-500/20 hover:bg-blue-500/30"
            style={getMarkerStyle(dialogue.startTime || 0, dialogue.duration || 0)}
            onMouseDown={(e) => handleMarkerMouseDown(e, 'dialogue', index)}
          >
            <div className="absolute -top-6 left-0 text-xs truncate max-w-[100px]">
              {dialogue.text}
            </div>
          </div>
        ))}

        {scene.actions.map((action, index) => (
          <div
            key={`action-${index}`}
            className="timeline-marker bg-green-500/20 hover:bg-green-500/30"
            style={getMarkerStyle(action.startTime, action.duration)}
            onMouseDown={(e) => handleMarkerMouseDown(e, 'action', index)}
          >
            <div className="absolute -top-6 left-0 text-xs truncate max-w-[100px]">
              {action.type}
            </div>
          </div>
        ))}

        <div
          className="playhead"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {selectedType && selectedIndex !== null && (
        <div className="p-4 border rounded bg-white">
          {selectedType === 'dialogue' ? (
            <div>
              <h4 className="font-medium mb-2">Edit Dialogue</h4>
              <textarea
                className="w-full p-2 border rounded mb-2"
                value={scene.dialogues[selectedIndex].text}
                onChange={(e) => {
                  const updatedDialogue = {
                    ...scene.dialogues[selectedIndex],
                    text: e.target.value
                  };
                  handleDialogueEdit(selectedIndex, updatedDialogue);
                }}
              />
              <button
                onClick={() => handleDialogueDelete(selectedIndex)}
                disabled={isUpdating}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
              >
                {isUpdating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-2">Edit Action</h4>
              <select
                className="w-full p-2 border rounded mb-2"
                value={scene.actions[selectedIndex].type}
                onChange={(e) => {
                  const updatedAction = {
                    ...scene.actions[selectedIndex],
                    type: e.target.value as Action['type']
                  };
                  handleActionEdit(selectedIndex, updatedAction);
                }}
              >
                <option value="move">Move</option>
                <option value="rotate">Rotate</option>
                <option value="scale">Scale</option>
                <option value="gesture">Gesture</option>
                <option value="expression">Expression</option>
                <option value="lipsync">Lip Sync</option>
              </select>
              <button
                onClick={() => handleActionDelete(selectedIndex)}
                disabled={isUpdating}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
              >
                {isUpdating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}