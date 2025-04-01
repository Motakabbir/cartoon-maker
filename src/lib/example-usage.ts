import {
  createScript,
  createScene,
  createCharacter,
  addCharacterToScene,
  createDialogue,
  createAction,
  getSceneWithDetails
} from './database-helpers';

async function exampleUsage() {
  // Create a new script
  const script = await createScript({
    title: "Adventure in the Park",
    fps: 30,
    resolution: { width: 1920, height: 1080 }
  });

  // Create two characters
  const hero = await createCharacter({
    name: "Hero",
    model: "hero_model_v1"
  });

  const sidekick = await createCharacter({
    name: "Sidekick",
    model: "sidekick_model_v1"
  });

  // Create a scene
  const scene = await createScene({
    scriptId: script.id,
    background: "park_background",
    lighting: "afternoon",
    timeOfDay: "day",
    weather: "sunny",
    duration: 10.0,
    order: 1
  });

  // Add characters to the scene with their initial positions
  await addCharacterToScene({
    sceneId: scene.id,
    characterId: hero.id,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0
  });

  await addCharacterToScene({
    sceneId: scene.id,
    characterId: sidekick.id,
    position: { x: 2, y: 0, z: 0 },
    rotation: { x: 0, y: 180, z: 0 },
    scale: 1.0
  });

  // Add dialogue
  await createDialogue({
    sceneId: scene.id,
    characterId: hero.id,
    text: "What a beautiful day in the park!",
    emotion: "happy",
    voiceSettings: {
      voice: "friendly_male",
      pitch: 1.0,
      speed: 1.0
    },
    startTime: 1.0,
    duration: 3.0
  });

  // Add an action (walking animation)
  await createAction({
    sceneId: scene.id,
    characterId: hero.id,
    type: "walk",
    params: {
      from: { x: 0, y: 0, z: 0 },
      to: { x: 5, y: 0, z: 0 },
      easing: "linear"
    },
    startTime: 4.0,
    duration: 2.0
  });

  // Retrieve the complete scene data
  const sceneWithDetails = await getSceneWithDetails(scene.id);
  console.log('Scene details:', JSON.stringify(sceneWithDetails, null, 2));
}

// Export for use in other files
export { exampleUsage };