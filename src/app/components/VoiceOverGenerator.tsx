'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialogue, VoiceSettings } from '../types/animation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faPlay } from '@fortawesome/free-solid-svg-icons';

interface VoiceOverGeneratorProps {
  dialogue: Dialogue;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  onPreview: () => void;
  onGenerate: (audioBlob: Blob) => Promise<void>;
}

export default function VoiceOverGenerator({
  dialogue,
  onVoiceSettingsChange,
  onPreview,
  onGenerate
}: VoiceOverGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handlePreview = () => {
    if (previewPlaying) {
      window.speechSynthesis.cancel();
      setPreviewPlaying(false);
      return;
    }

    setPreviewPlaying(true);
    const utterance = new SpeechSynthesisUtterance(dialogue.text);
    utterance.voice = availableVoices.find(v => v.name === dialogue.voiceSettings.voice) || null;
    utterance.pitch = dialogue.voiceSettings.pitch;
    utterance.rate = dialogue.voiceSettings.speed;

    utterance.onend = () => {
      setPreviewPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const generateAudio = async () => {
    try {
      setIsGenerating(true);
      
      // Create oscillator for visual feedback
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Mute the oscillator
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const stream = oscillator.connect(gainNode).connect(audioContext.destination);
      mediaRecorder.current = new MediaRecorder(stream as unknown as MediaStream);
      
      const chunks: BlobPart[] = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        await onGenerate(blob);
        setIsGenerating(false);
      };

      mediaRecorder.current.start();
      
      const utterance = new SpeechSynthesisUtterance(dialogue.text);
      utterance.voice = availableVoices.find(v => v.name === dialogue.voiceSettings.voice) || null;
      utterance.pitch = dialogue.voiceSettings.pitch;
      utterance.rate = dialogue.voiceSettings.speed;

      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.current?.stop();
          oscillator.stop();
        }, 100);
      };

      oscillator.start();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error generating audio:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 text-purple-900">Voice Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">Voice</label>
              <select
                className="w-full p-2.5 bg-white border border-purple-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={dialogue.voiceSettings.voice}
                onChange={(e) => onVoiceSettingsChange({
                  ...dialogue.voiceSettings,
                  voice: e.target.value
                })}
              >
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Pitch <span className="text-purple-600 ml-1">{dialogue.voiceSettings.pitch}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                value={dialogue.voiceSettings.pitch}
                onChange={(e) => onVoiceSettingsChange({
                  ...dialogue.voiceSettings,
                  pitch: Number(e.target.value)
                })}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Speed <span className="text-purple-600 ml-1">{dialogue.voiceSettings.speed}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                value={dialogue.voiceSettings.speed}
                onChange={(e) => onVoiceSettingsChange({
                  ...dialogue.voiceSettings,
                  speed: Number(e.target.value)
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Emphasis <span className="text-purple-600 ml-1">{dialogue.voiceSettings.emphasis ?? 1}x</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                value={dialogue.voiceSettings.emphasis ?? 1}
                onChange={(e) => onVoiceSettingsChange({
                  ...dialogue.voiceSettings,
                  emphasis: Number(e.target.value)
                })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          onClick={handlePreview}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-purple-200 text-sm font-medium rounded-lg text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          disabled={isGenerating}
        >
          <FontAwesomeIcon icon={faPlay} className="mr-2" />
          {previewPlaying ? 'Stop Preview' : 'Preview'}
        </button>
        
        <button
          onClick={generateAudio}
          disabled={isGenerating}
          className={`inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg text-white ${
            isGenerating
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
          }`}
        >
          <FontAwesomeIcon icon={faMicrophone} className={`mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate Audio'}
        </button>
      </div>
    </div>
  );
}