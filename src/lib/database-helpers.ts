import { prisma } from './db';
import type { Character, Script, Scene, SceneCharacter, Dialogue, Action, Prisma } from '@prisma/client';

// Character Management
export async function createCharacter(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) {
  return prisma.character.create({ data });
}

export async function getCharacter(id: string) {
  return prisma.character.findUnique({
    where: { id },
    include: {
      appearances: true,
      dialogues: true,
      actions: true,
    },
  });
}

export async function getAllCharacters() {
  return prisma.character.findMany();
}

// Script Management
export async function createScript(data: { 
  title: string; 
  fps: number; 
  resolution: { width: number; height: number; }
}) {
  return prisma.script.create({ 
    data: {
      title: data.title,
      fps: data.fps,
      resolution: data.resolution as Prisma.InputJsonValue
    } 
  });
}

export async function updateScript(id: string, data: Partial<{
  title: string;
  fps: number;
  resolution: { width: number; height: number; }
}>) {
  return prisma.script.update({
    where: { id },
    data: {
      ...data,
      resolution: data.resolution ? data.resolution as Prisma.InputJsonValue : undefined
    },
  });
}

// Scene Management
export async function createScene(data: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>) {
  return prisma.scene.create({ data });
}

export async function updateScene(id: string, data: Partial<Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>>) {
  return prisma.scene.update({
    where: { id },
    data,
  });
}

// Scene Character Management
export async function addCharacterToScene(data: {
  sceneId: string;
  characterId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}) {
  return prisma.sceneCharacter.create({ 
    data: {
      sceneId: data.sceneId,
      characterId: data.characterId,
      position: data.position as Prisma.InputJsonValue,
      rotation: data.rotation as Prisma.InputJsonValue,
      scale: data.scale
    } 
  });
}

// Dialogue Management
export async function createDialogue(data: {
  sceneId: string;
  characterId: string;
  text: string;
  emotion: string;
  voiceSettings: Record<string, unknown>;
  startTime?: number | null;
  duration?: number | null;
}) {
  return prisma.dialogue.create({ 
    data: {
      sceneId: data.sceneId,
      characterId: data.characterId,
      text: data.text,
      emotion: data.emotion,
      voiceSettings: data.voiceSettings as Prisma.InputJsonValue,
      startTime: data.startTime,
      duration: data.duration
    } 
  });
}

export async function updateDialogue(id: string, data: Partial<{
  text: string;
  emotion: string;
  voiceSettings: Record<string, unknown>;
  startTime?: number | null;
  duration?: number | null;
}>) {
  return prisma.dialogue.update({
    where: { id },
    data: {
      ...data,
      voiceSettings: data.voiceSettings ? data.voiceSettings as Prisma.InputJsonValue : undefined
    },
  });
}

export async function deleteDialogue(id: string) {
  return prisma.dialogue.delete({
    where: { id },
  });
}

// Action Management
export async function createAction(data: {
  sceneId: string;
  characterId: string;
  type: string;
  params: Record<string, unknown>;
  startTime: number;
  duration: number;
}) {
  return prisma.action.create({ 
    data: {
      sceneId: data.sceneId,
      characterId: data.characterId,
      type: data.type,
      params: data.params as Prisma.InputJsonValue,
      startTime: data.startTime,
      duration: data.duration
    } 
  });
}

export async function updateAction(id: string, data: Partial<{
  type: string;
  params: Record<string, unknown>;
  startTime: number;
  duration: number;
}>) {
  return prisma.action.update({
    where: { id },
    data: {
      ...data,
      params: data.params ? data.params as Prisma.InputJsonValue : undefined
    },
  });
}

export async function deleteAction(id: string) {
  return prisma.action.delete({
    where: { id },
  });
}

// Utility function to get complete scene data
export async function getSceneWithDetails(id: string) {
  return prisma.scene.findUnique({
    where: { id },
    include: {
      characters: {
        include: {
          character: true,
        },
      },
      dialogues: {
        include: {
          character: true,
        },
      },
      actions: {
        include: {
          character: true,
        },
      },
    },
  });
}