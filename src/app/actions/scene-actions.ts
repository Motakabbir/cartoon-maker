'use server';

import { createScene, createAction, createDialogue, updateScene, deleteAction, deleteDialogue, getSceneWithDetails } from '@/lib/database-helpers';
import { updateDialogue as updateSceneDialogue, updateAction as updateSceneAction } from '@/lib/database-helpers';
import { Action, ActionParams, ActionType, Dialogue, Emotion, VoiceSettings } from '../types/animation';

interface ActionUpdateData {
  type?: ActionType;
  params?: ActionParams;
  startTime?: number;
  duration?: number;
}

interface DialogueUpdateData {
  text?: string;
  emotion?: Emotion;
  voiceSettings?: VoiceSettings;
  startTime?: number;
  duration?: number;
}

export async function addScene(data: { 
  scriptId: string;
  background: string;
  lighting: string;
  timeOfDay: string;
  weather: string;
  duration: number;
  order: number;
}) {
  const newScene = await createScene(data);
  const sceneWithDetails = await getSceneWithDetails(newScene.id);
  return sceneWithDetails;
}

export async function addAction(data: {
  sceneId: string;
  characterId: string;
  type: ActionType;
  params: ActionParams;
  startTime: number;
  duration: number;
}) {
  return createAction({
    ...data,
    params: JSON.stringify(data.params)
  });
}

export async function removeAction(id: string) {
  return deleteAction(id);
}

export async function addDialogue(data: {
  sceneId: string;
  characterId: string;
  text: string;
  emotion: string;
  voiceSettings: VoiceSettings;
  startTime?: number | null;
  duration?: number | null;
}) {
  return createDialogue({
    ...data,
    voiceSettings: JSON.stringify(data.voiceSettings)
  });
}

export async function removeDialogue(id: string) {
  return deleteDialogue(id);
}

export async function updateSceneData(id: string, data: {
  background?: string;
  lighting?: string;
  timeOfDay?: string;
  weather?: string;
  duration?: number;
}) {
  return updateScene(id, data);
}

export async function updateAction(actionId: string, data: ActionUpdateData) {
  return updateSceneAction(actionId, {
    ...data,
    params: data.params ? JSON.stringify(data.params) : undefined
  });
}

export async function updateDialogue(dialogueId: string, data: DialogueUpdateData) {
  return updateSceneDialogue(dialogueId, {
    ...data,
    voiceSettings: data.voiceSettings ? JSON.stringify(data.voiceSettings) : undefined
  });
}