import Replicate from 'replicate';
import { Character, CharacterGenerationPrompt } from '../types/character';
import { VoiceSettings } from '../types/animation';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateCharacter(prompt: CharacterGenerationPrompt): Promise<Character> {
  try {
    // Generate character image using Stable Diffusion
    const output = await replicate.run(
      "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
      {
        input: {
          prompt: `high quality ${prompt.style} character: ${prompt.description}, ${prompt.mood} expression, full body shot, white background`,
          negative_prompt: "blurry, dark, multiple characters, watermark",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : String(output);
    
    // Extract character features based on the prompt
    const character: Character = {
      id: Date.now().toString(),
      name: 'Generated Character',
      imageUrl,
      features: {
        face: {
          eyes: prompt.description.toLowerCase().includes('eyes') ? prompt.description.split('eyes')[0].split(' ').pop() || 'normal' : 'normal',
          nose: 'normal',
          mouth: prompt.mood === 'happy' ? 'smile' : prompt.mood === 'sad' ? 'frown' : 'neutral',
          hairstyle: prompt.description.toLowerCase().includes('hair') ? prompt.description.split('hair')[0].split(' ').pop() || 'normal' : 'normal',
          skinTone: prompt.description.toLowerCase().includes('skin') ? prompt.description.split('skin')[0].split(' ').pop() || 'medium' : 'medium'
        },
        outfit: {
          type: prompt.description.toLowerCase().includes('wearing') ? prompt.description.split('wearing')[1].split(' ')[1] || 'casual' : 'casual',
          color: prompt.description.toLowerCase().includes('color') ? prompt.description.split('color')[0].split(' ').pop() || 'neutral' : 'neutral',
          accessories: []
        },
        expression: prompt.mood || 'neutral'
      },
      animation: {
        currentPose: 'idle',
        currentExpression: prompt.mood || 'neutral'
      }
    };

    return character;
  } catch (error) {
    console.error('Error generating character:', error);
    throw new Error('Failed to generate character');
  }
}

export async function generateVoiceOver(
  text: string,
  settings: VoiceSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings with proper type handling
      utterance.pitch = settings.pitch;
      utterance.rate = settings.speed;
      utterance.volume = settings.emphasis ?? 1.0; // Use nullish coalescing for optional emphasis

      // Get available voices and set the selected voice
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes(settings.voice.toLowerCase())
      ) || voices[0];
      
      if (!selectedVoice) {
        throw new Error('No voices available');
      }

      utterance.voice = selectedVoice;

      // Create an audio context for recording
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioCtx.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        resolve(audioUrl);
      };

      utterance.onend = () => {
        mediaRecorder.stop();
        audioCtx.close();
      };

      mediaRecorder.start();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error);
    }
  });
}

export async function analyzeScript(text: string) {
  // TODO: Implement script analysis for automatic animation
  // This would typically involve:
  // 1. Using NLP to detect emotions and actions in the text
  // 2. Converting detected elements into animation parameters
  
  return {
    emotion: 'neutral',
    intensity: 1,
    suggestedActions: []
  };
}

export async function generateBackground(
  description: string,
  timeOfDay: string,
  weather?: string
): Promise<string> {
  try {
    const prompt = `high quality background scene: ${description}, ${timeOfDay} time, ${weather || 'clear weather'}, wide angle, establishing shot, no characters`;
    
    const output = await replicate.run(
      "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
      {
        input: {
          prompt,
          negative_prompt: "blurry, text, watermark, people, characters, low quality",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 1024,
          height: 576,
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : String(output);
    return imageUrl;
  } catch (error) {
    console.error('Error generating background:', error);
    throw new Error('Failed to generate background');
  }
}