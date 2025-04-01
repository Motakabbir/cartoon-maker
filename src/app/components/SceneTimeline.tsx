import { useState, useEffect, useCallback } from 'react';
import { Scene, Dialogue, Action, ActionType, ActionParams, TransformActionParams, ScaleActionParams, GestureActionParams, ExpressionActionParams, LipsyncActionParams, Vector3, Emotion } from '../types/animation';
import { addDialogue, removeDialogue, addAction, removeAction } from '@/app/actions/scene-actions';
import { updateDialogue, updateAction } from '@/app/actions/scene-actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faRunning, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface SceneTimelineProps {
  scene: Scene;
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSceneUpdate: (scene: Scene) => void;
}

function createDefaultParams(type: ActionType): ActionParams {
  switch (type) {
    case 'move':
    case 'rotate':
      return {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 0 },
        easing: 'linear'
      } as TransformActionParams;
    case 'scale':
      return {
        from: 1,
        to: 1,
        easing: 'linear'
      } as ScaleActionParams;
    case 'gesture':
      return {
        gesture: 'wave',
        intensity: 1,
        easing: 'easeInOut'
      } as GestureActionParams;
    case 'expression':
      return {
        expression: 'neutral' as Emotion,
        intensity: 1,
        easing: 'easeInOut'
      } as ExpressionActionParams;
    case 'lipsync':
      return {
        from: 0,
        to: 1,
        easing: 'linear'
      } as LipsyncActionParams;
  }
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
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    const timeline = e.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * duration;
    onTimeUpdate(Math.max(0, Math.min(duration, newTime)));
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, type: 'dialogue' | 'action', index: number) => {
    e.stopPropagation();
    setSelectedType(type);
    setSelectedIndex(index);
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartTime(type === 'dialogue' ? scene.dialogues[index].startTime! : scene.actions[index].startTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || selectedType === null || selectedIndex === null) return;

      const timeline = document.getElementById('timeline');
      if (!timeline) return;

      const rect = timeline.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = (deltaX / rect.width) * duration;
      const newTime = Math.max(0, Math.min(duration, dragStartTime + deltaTime));

      if (selectedType === 'dialogue') {
        const dialogues = [...scene.dialogues];
        dialogues[selectedIndex] = {
          ...dialogues[selectedIndex],
          startTime: newTime
        };
        onSceneUpdate({ ...scene, dialogues });
      } else {
        const actions = [...scene.actions];
        actions[selectedIndex] = {
          ...actions[selectedIndex],
          startTime: newTime
        };
        onSceneUpdate({ ...scene, actions });
      }
    };

    const handleMouseUp = () => {
      if (isDragging && selectedType && selectedIndex !== null) {
        const item = selectedType === 'dialogue' 
          ? scene.dialogues[selectedIndex] 
          : scene.actions[selectedIndex];
        
        handleItemUpdate(selectedType, selectedIndex, item);
      }
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedType, selectedIndex, dragStartX, dragStartTime, scene, duration, onSceneUpdate]);

  const handleItemUpdate = async (
    type: 'dialogue' | 'action',
    index: number,
    item: Dialogue | Action
  ) => {
    if (!item.id) return;
    setIsUpdating(true);
    setError(null);

    try {
      if (type === 'dialogue') {
        await updateDialogue(item.id, {
          text: (item as Dialogue).text,
          emotion: (item as Dialogue).emotion,
          voiceSettings: (item as Dialogue).voiceSettings,
          startTime: (item as Dialogue).startTime,
          duration: (item as Dialogue).duration
        });
      } else {
        await updateAction(item.id, {
          type: (item as Action).type,
          params: (item as Action).params,
          startTime: (item as Action).startTime,
          duration: (item as Action).duration
        });
      }
    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
      setError(`Failed to update ${type}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionAdd = async () => {
    if (!scene.id) return;
    setIsUpdating(true);
    setError(null);

    try {
      const newAction: Omit<Action, 'id'> = {
        characterId: scene.characters[0]?.characterId || '',
        type: 'move',
        params: createDefaultParams('move'),
        startTime: currentTime,
        duration: 2.0
      };

      const createdAction = await addAction({
        sceneId: scene.id,
        characterId: newAction.characterId,
        type: newAction.type,
        params: newAction.params,
        startTime: newAction.startTime,
        duration: newAction.duration
      });

      onSceneUpdate({
        ...scene,
        actions: [...scene.actions, { ...newAction, id: createdAction.id }]
      });
    } catch (error) {
      console.error('Failed to add action:', error);
      setError('Failed to add action');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionDelete = async (index: number) => {
    const actionToDelete = scene.actions[index];
    if (!actionToDelete?.id) return;

    setIsUpdating(true);
    setError(null);
    try {
      await removeAction(actionToDelete.id);
      
      onSceneUpdate({
        ...scene,
        actions: scene.actions.filter((_, i) => i !== index)
      });
      setSelectedType(null);
      setSelectedIndex(null);
    } catch (error) {
      console.error('Failed to delete action:', error);
      setError('Failed to delete action');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionEdit = async (index: number, updatedAction: Action) => {
    if (!updatedAction.id) return;
    setIsUpdating(true);
    setError(null);
    
    try {
      await updateAction(updatedAction.id, {
        type: updatedAction.type,
        params: updatedAction.params,
        startTime: updatedAction.startTime,
        duration: updatedAction.duration
      });

      onSceneUpdate({
        ...scene,
        actions: scene.actions.map((a, i) => i === index ? updatedAction : a)
      });
    } catch (error) {
      console.error('Failed to update action:', error);
      setError('Failed to update action');
    } finally {
      setIsUpdating(false);
    }
  };

  const getMarkerStyle = (startTime: number, duration: number) => {
    const left = `${(startTime / scene.duration) * 100}%`;
    const width = `${(duration / scene.duration) * 100}%`;
    return { left, width };
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={handleActionAdd}
            disabled={isUpdating}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faRunning} />
            Add Action
          </button>
        </div>
      </div>

      <div
        id="timeline"
        className="relative h-32 bg-purple-50 rounded-lg cursor-pointer"
        onClick={handleTimelineClick}
      >
        {/* Time marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-purple-600 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-px bg-purple-200"
              style={{ left: `${(i / 10) * 100}%` }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="absolute top-4 left-0 right-0 h-8">
          {scene.actions.map((action, index) => (
            <div
              key={`action-${index}`}
              className={`absolute h-full rounded transition-all duration-200 cursor-move ${
                selectedType === 'action' && selectedIndex === index
                  ? 'bg-green-500/40 ring-2 ring-green-500 ring-offset-2'
                  : 'bg-green-500/20 hover:bg-green-500/30'
              }`}
              style={getMarkerStyle(action.startTime, action.duration)}
              onMouseDown={(e) => handleMarkerMouseDown(e, 'action', index)}
            >
              <div className="absolute -top-6 left-0 text-xs truncate max-w-[100px]">
                <div className="bg-white px-1.5 py-0.5 rounded border border-green-200 shadow-sm">
                  {action.type}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Time labels */}
        <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between px-2 text-xs text-purple-600">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i}>{((i / 10) * duration).toFixed(1)}s</span>
          ))}
        </div>
      </div>

      {/* Action editor */}
      {selectedType === 'action' && selectedIndex !== null && (
        <div className="bg-white p-4 rounded-lg border border-purple-100 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-purple-900">Edit Action</h4>
            <button
              onClick={() => handleActionDelete(selectedIndex)}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">Type</label>
              <select
                className="w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={scene.actions[selectedIndex].type}
                onChange={(e) => {
                  const action = scene.actions[selectedIndex];
                  const type = e.target.value as ActionType;
                  const updatedAction = {
                    ...action,
                    type,
                    params: createDefaultParams(type)
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
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={scene.actions[selectedIndex].duration}
                  onChange={(e) => {
                    const updatedAction = {
                      ...scene.actions[selectedIndex],
                      duration: parseFloat(e.target.value)
                    };
                    handleActionEdit(selectedIndex, updatedAction);
                  }}
                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <span className="w-16 text-center font-mono text-sm">
                  {scene.actions[selectedIndex].duration.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* Action-specific parameters */}
          <div className="space-y-4">
            {(() => {
              const action = scene.actions[selectedIndex];
              switch (action.type) {
                case 'move':
                case 'rotate':
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">From</label>
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={(action.params as TransformActionParams).from.x}
                            onChange={(e) => {
                              const action = scene.actions[selectedIndex];
                              const params = { ...(action.params as TransformActionParams) };
                              params.from.x = parseFloat(e.target.value);
                              handleActionEdit(selectedIndex, { ...action, params: params as ActionParams });
                            }}
                            className="w-full p-2 border border-purple-200 rounded"
                            placeholder="X"
                          />
                          <input
                            type="number"
                            value={(action.params as TransformActionParams).from.y}
                            onChange={(e) => {
                              const params = { ...(action.params as TransformActionParams) };
                              params.from.y = parseFloat(e.target.value);
                              handleActionEdit(selectedIndex, { ...action, params });
                            }}
                            className="w-full p-2 border border-purple-200 rounded"
                            placeholder="Y"
                          />
                          <input
                            type="number"
                            value={(action.params as TransformActionParams).from.z}
                            onChange={(e) => {
                              const params = { ...(action.params as TransformActionParams) };
                              params.from.z = parseFloat(e.target.value);
                              handleActionEdit(selectedIndex, { ...action, params });
                            }}
                            className="w-full p-2 border border-purple-200 rounded"
                            placeholder="Z"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">To</label>
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={(action.params as TransformActionParams).to.x}
                            onChange={(e) => {
                              const params = { ...(action.params as TransformActionParams) };
                              params.to.x = parseFloat(e.target.value);
                              handleActionEdit(selectedIndex, { ...action, params });
                            }}
                            className="w-full p-2 border border-purple-200 rounded"
                            placeholder="X"
                          />
                          <input
                            type="number"
                            value={(action.params as TransformActionParams).to.y}
                            onChange={(e) => {
                              const params = { ...(action.params as TransformActionParams) };
                              params.to.y = parseFloat(e.target.value);
                              handleActionEdit(selectedIndex, { ...action, params });
                            }}
                            className="w-full p-2 border border-purple-200 rounded"
                            placeholder="Y"
                          />
                          <input
                            type="number"
                            value={(action.params as TransformActionParams).to.z}
                            onChange={(e) => {
                              const params = { ...(action.params as TransformActionParams) };
                              params.to.z = parseFloat(e.target.value);
                              handleActionEdit(selectedIndex, { ...action, params });
                            }}
                            className="w-full p-2 border border-purple-200 rounded"
                            placeholder="Z"
                          />
                        </div>
                      </div>
                    </div>
                  );

                case 'scale':
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">From</label>
                        <input
                          type="number"
                          value={(action.params as ScaleActionParams).from}
                          onChange={(e) => {
                            const params = { ...(action.params as ScaleActionParams) };
                            params.from = parseFloat(e.target.value);
                            handleActionEdit(selectedIndex, { ...action, params });
                          }}
                          className="w-full p-2 border border-purple-200 rounded"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">To</label>
                        <input
                          type="number"
                          value={(action.params as ScaleActionParams).to}
                          onChange={(e) => {
                            const params = { ...(action.params as ScaleActionParams) };
                            params.to = parseFloat(e.target.value);
                            handleActionEdit(selectedIndex, { ...action, params });
                          }}
                          className="w-full p-2 border border-purple-200 rounded"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                    </div>
                  );

                case 'gesture':
                  return (
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-2">Gesture</label>
                      <select
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={(action.params as GestureActionParams).gesture}
                        onChange={(e) => {
                          const action = scene.actions[selectedIndex];
                          const params = { ...(action.params as GestureActionParams) };
                          params.gesture = e.target.value as GestureActionParams['gesture'];
                          handleActionEdit(selectedIndex, { ...action, params: params as ActionParams });
                        }}
                      >
                        <option value="wave">Wave</option>
                        <option value="point">Point</option>
                        <option value="clap">Clap</option>
                        <option value="jump">Jump</option>
                        <option value="dance">Dance</option>
                        <option value="spin">Spin</option>
                      </select>
                    </div>
                  );

                case 'expression':
                  return (
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-2">Expression</label>
                      <select
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={(action.params as ExpressionActionParams).expression}
                        onChange={(e) => {
                          const params = { ...(action.params as ExpressionActionParams) };
                          params.expression = e.target.value as Emotion;
                          handleActionEdit(selectedIndex, { ...action, params });
                        }}
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
                  );

                case 'lipsync':
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">From</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(action.params as LipsyncActionParams).from}
                          onChange={(e) => {
                            const params = { ...(action.params as LipsyncActionParams) };
                            params.from = parseFloat(e.target.value);
                            handleActionEdit(selectedIndex, { ...action, params });
                          }}
                          className="w-full p-2 border border-purple-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-2">To</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(action.params as LipsyncActionParams).to}
                          onChange={(e) => {
                            const params = { ...(action.params as LipsyncActionParams) };
                            params.to = parseFloat(e.target.value);
                            handleActionEdit(selectedIndex, { ...action, params });
                          }}
                          className="w-full p-2 border border-purple-200 rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-purple-900 mb-2">Easing</label>
                        <select
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          value={(action.params as LipsyncActionParams).easing || 'linear'}
                          onChange={(e) => {
                            const params = { ...(action.params as LipsyncActionParams) };
                            params.easing = e.target.value as 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
                            handleActionEdit(selectedIndex, { ...action, params });
                          }}
                        >
                          <option value="linear">Linear</option>
                          <option value="easeIn">Ease In</option>
                          <option value="easeOut">Ease Out</option>
                          <option value="easeInOut">Ease In Out</option>
                        </select>
                      </div>
                    </div>
                  );
              }
            })()}
          </div>

          {/* Easing parameter */}
          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">Easing</label>
            <select
              className="w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={scene.actions[selectedIndex].params.easing || 'linear'}
              onChange={(e) => {
                const action = scene.actions[selectedIndex];
                const params = { ...action.params, easing: e.target.value };
                handleActionEdit(selectedIndex, { 
                  ...action, 
                  params: params as ActionParams 
                });
              }}
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In Out</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}