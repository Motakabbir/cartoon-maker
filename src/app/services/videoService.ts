import { Scene, Dialogue, Action } from '../types/animation';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    await ffmpeg.load();
  }
  return ffmpeg;
}

export async function renderScene(scene: Scene): Promise<string> {
  try {
    const ffmpeg = await initFFmpeg();
    
    // Create a canvas for rendering frames
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    const frameRate = 30;
    const totalFrames = Math.ceil(scene.duration * frameRate);
    
    // Render each frame
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / frameRate;
      
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      if (scene.background !== 'default') {
        const bgImage = new Image();
        bgImage.src = scene.background;
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      }
      
      // Draw characters with their current state
      for (const charPos of scene.characters) {
        const actions = scene.actions.filter(a => 
          a.characterId === charPos.characterId &&
          time >= a.startTime &&
          time < (a.startTime + a.duration)
        );
        
        // Calculate character state based on active actions
        const state = calculateCharacterState(charPos, actions, time);
        
        // Draw character with current state
        await drawCharacter(ctx, state);
      }
      
      // Convert frame to file
      const frameData = canvas.toDataURL('image/png').split(',')[1];
      await ffmpeg.writeFile(`frame${frame.toString().padStart(6, '0')}.png`, frameData);
    }
    
    // Combine frames into video
    await ffmpeg.exec([
      '-framerate', frameRate.toString(),
      '-i', 'frame%06d.png',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      'output.mp4'
    ]);
    
    // Read the output video
    const data = await ffmpeg.readFile('output.mp4');
    const videoBlob = new Blob([data], { type: 'video/mp4' });
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error('Error rendering scene:', error);
    throw new Error('Failed to render scene');
  }
}

function calculateCharacterState(
  charPos: Scene['characters'][0],
  actions: Action[],
  currentTime: number
) {
  let state = { ...charPos };
  
  for (const action of actions) {
    const progress = (currentTime - action.startTime) / action.duration;
    const easing = action.params.easing || 'linear';
    
    switch (action.type) {
      case 'move':
        state.position = interpolatePosition(
          action.params.from,
          action.params.to,
          progress,
          easing
        );
        break;
      case 'rotate':
        state.rotation = interpolateRotation(
          action.params.from,
          action.params.to,
          progress,
          easing
        );
        break;
      case 'scale':
        state.scale = interpolateScale(
          action.params.from,
          action.params.to,
          progress,
          easing
        );
        break;
    }
  }
  
  return state;
}

async function drawCharacter(
  ctx: CanvasRenderingContext2D,
  state: any
) {
  // Load character image
  const charImage = new Image();
  charImage.src = state.imageUrl;
  
  // Apply transformations
  ctx.save();
  ctx.translate(state.position.x, state.position.y);
  ctx.rotate(state.rotation.y * Math.PI / 180);
  ctx.scale(state.scale, state.scale);
  
  // Draw character
  ctx.drawImage(
    charImage,
    -charImage.width / 2,
    -charImage.height / 2,
    charImage.width,
    charImage.height
  );
  
  ctx.restore();
}

// Helper functions for interpolation
function interpolatePosition(from: any, to: any, progress: number, easing: string) {
  return {
    x: from.x + (to.x - from.x) * applyEasing(progress, easing),
    y: from.y + (to.y - from.y) * applyEasing(progress, easing),
    z: from.z + (to.z - from.z) * applyEasing(progress, easing)
  };
}

function interpolateRotation(from: any, to: any, progress: number, easing: string) {
  return {
    x: from.x + (to.x - from.x) * applyEasing(progress, easing),
    y: from.y + (to.y - from.y) * applyEasing(progress, easing),
    z: from.z + (to.z - from.z) * applyEasing(progress, easing)
  };
}

function interpolateScale(from: number, to: number, progress: number, easing: string) {
  return from + (to - from) * applyEasing(progress, easing);
}

function applyEasing(progress: number, easing: string): number {
  switch (easing) {
    case 'easeIn':
      return progress * progress;
    case 'easeOut':
      return 1 - Math.pow(1 - progress, 2);
    case 'easeInOut':
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    default: // linear
      return progress;
  }
}