'use client';

import { useState, useEffect } from 'react';
import { Action, Position3D, Rotation3D } from '../types/animation';

interface AnimationState {
  position: Position3D;
  rotation: Rotation3D;
  scale: number;
  expression: string;
  gesture: string;
  lipsync: number;
}

function interpolate(start: number, end: number, progress: number, easing: string = 'linear'): number {
  const t = Math.max(0, Math.min(1, progress));
  
  switch (easing) {
    case 'easeIn':
      return start + (end - start) * (t * t);
    case 'easeOut':
      return start + (end - start) * (1 - (1 - t) * (1 - t));
    case 'easeInOut':
      return start + (end - start) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    default: // linear
      return start + (end - start) * t;
  }
}

function interpolatePosition(
  start: Position3D,
  end: Position3D,
  progress: number,
  easing: string
): Position3D {
  return {
    x: interpolate(start.x, end.x, progress, easing),
    y: interpolate(start.y, end.y, progress, easing),
    z: interpolate(start.z, end.z, progress, easing),
  };
}

function interpolateRotation(
  start: Rotation3D,
  end: Rotation3D,
  progress: number,
  easing: string
): Rotation3D {
  return {
    x: interpolate(start.x, end.x, progress, easing),
    y: interpolate(start.y, end.y, progress, easing),
    z: interpolate(start.z, end.z, progress, easing),
  };
}

export function useAnimation(
  actions: Action[],
  currentTime: number,
  sceneStartTime: number
): AnimationState {
  const [state, setState] = useState<AnimationState>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    expression: 'neutral',
    gesture: 'idle',
    lipsync: 0,
  });

  useEffect(() => {
    // Get the relative time within the scene
    const localTime = currentTime - sceneStartTime;
    
    // Find all active actions at the current time
    const activeActions = actions.filter(action => {
      const actionEnd = action.startTime + action.duration;
      return localTime >= action.startTime && localTime <= actionEnd;
    });

    const newState = { ...state };

    // Apply each active action
    for (const action of activeActions) {
      const progress = (localTime - action.startTime) / action.duration;
      const easing = action.params.easing || 'linear';

      switch (action.type) {
        case 'move':
          if (action.params.from && action.params.to) {
            newState.position = interpolatePosition(
              action.params.from as Position3D,
              action.params.to as Position3D,
              progress,
              easing
            );
          }
          break;

        case 'rotate':
          if (action.params.from && action.params.to) {
            newState.rotation = interpolateRotation(
              action.params.from as Rotation3D,
              action.params.to as Rotation3D,
              progress,
              easing
            );
          }
          break;

        case 'scale':
          if (typeof action.params.from === 'number' && typeof action.params.to === 'number') {
            newState.scale = interpolate(action.params.from, action.params.to, progress, easing);
          }
          break;

        case 'gesture':
          newState.gesture = action.params.gesture || 'idle';
          break;

        case 'expression':
          newState.expression = action.params.expression || 'neutral';
          break;

        case 'lipsync':
          if (typeof action.params.from === 'number' && typeof action.params.to === 'number') {
            newState.lipsync = interpolate(action.params.from, action.params.to, progress, easing);
          }
          break;
      }
    }

    setState(newState);
  }, [actions, currentTime, sceneStartTime]);

  return state;
}