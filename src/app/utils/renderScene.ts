import { Scene } from '../types/animation';

// Re-export with explicit type declaration
export async function renderScene(scene: Scene): Promise<string> {
  const { renderScene: render } = await import('../services/videoService');
  return render(scene);
}