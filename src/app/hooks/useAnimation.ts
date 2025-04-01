'use client';

import { useState, useEffect } from 'react';
import { Action, Vector3, ActionType, ActionParams, TransformActionParams, ScaleActionParams, GestureActionParams, ExpressionActionParams, LipsyncActionParams } from '../types/animation';

interface AnimationState {
  position: Vector3;
  rotation: Vector3;
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

function interpolateVector3(start: Vector3, end: Vector3, progress: number, easing: string): Vector3 {
  return {
    x: interpolate(start.x, end.x, progress, easing),
    y: interpolate(start.y, end.y, progress, easing),
    z: interpolate(start.z, end.z, progress, easing),
  };
}

function isTransformParams(params: ActionParams): params is TransformActionParams {
  return 'from' in params && 'to' in params && typeof (params as TransformActionParams).from === 'object';
}

function isScaleParams(params: ActionParams): params is ScaleActionParams {
  return 'from' in params && 'to' in params && typeof (params as ScaleActionParams).from === 'number';
}

function isGestureParams(params: ActionParams): params is GestureActionParams {
  return 'gesture' in params;
}

function isExpressionParams(params: ActionParams): params is ExpressionActionParams {
  return 'expression' in params;
}

function isLipsyncParams(params: ActionParams): params is LipsyncActionParams {
  return 'from' in params && 'to' in params && typeof (params as LipsyncActionParams).from === 'number';
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
          if (isTransformParams(action.params)) {
            newState.position = interpolateVector3(
              action.params.from,
              action.params.to,
              progress,
              easing
            );
          }
          break;

        case 'rotate':
          if (isTransformParams(action.params)) {
            newState.rotation = interpolateVector3(
              action.params.from,
              action.params.to,
              progress,
              easing
            );
          }
          break;

        case 'scale':
          if (isScaleParams(action.params)) {
            newState.scale = interpolate(
              action.params.from,
              action.params.to,
              progress,
              easing
            );
          }
          break;

        case 'gesture':
          if (isGestureParams(action.params)) {
            newState.gesture = action.params.gesture;
          }
          break;

        case 'expression':
          if (isExpressionParams(action.params)) {
            newState.expression = action.params.expression;
          }
          break;

        case 'lipsync':
          if (isLipsyncParams(action.params)) {
            newState.lipsync = interpolate(
              action.params.from,
              action.params.to,
              progress,
              easing
            );
          }
          break;
      }
    }

    setState(newState);
  }, [actions, currentTime, sceneStartTime]);

  return state;
}