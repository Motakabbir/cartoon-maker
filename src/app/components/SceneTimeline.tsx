'use client';

import { useState, useEffect, useCallback } from 'react';
import { Scene, Dialogue, Action } from '../types/animation';

interface SceneTimelineProps {
  scene: Scene;
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDialogueAdd: (dialogue: Dialogue) => void;
  onActionAdd: (action: Action) => void;
  onDialogueEdit: (index: number, dialogue: Dialogue) => void;
  onActionEdit: (index: number, action: Action) => void;
  onDialogueDelete: (index: number) => void;
  onActionDelete: (index: number) => void;
}

export default function SceneTimeline({
  scene,
  duration,
  currentTime,
  onTimeUpdate,
  onDialogueAdd,
  onActionAdd,
  onDialogueEdit,
  onActionEdit,
  onDialogueDelete,
  onActionDelete
}: SceneTimelineProps) {
  const [selectedType, setSelectedType] = useState<'dialogue' | 'action' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
            onDialogueAdd(newDialogue);
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
            onActionAdd(newAction);
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
                  onDialogueEdit(selectedIndex, updatedDialogue);
                }}
              />
              <button
                onClick={() => onDialogueDelete(selectedIndex)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
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
                  onActionEdit(selectedIndex, updatedAction);
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
                onClick={() => onActionDelete(selectedIndex)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}