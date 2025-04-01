'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialogue, VoiceSettings } from '../types/animation';

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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
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

    const utterance = new SpeechSynthesisUtterance(dialogue.text);
    utterance.voice = availableVoices.find(v => v.name === dialogue.voiceSettings.voice) || null;
    utterance.pitch = dialogue.voiceSettings.pitch;
    utterance.rate = dialogue.voiceSettings.speed;
    utterance.volume = dialogue.voiceSettings.emphasis ?? 1.0;

    utterance.onend = () => setPreviewPlaying(false);
    setPreviewPlaying(true);
    window.speechSynthesis.speak(utterance);
    onPreview();
  };

  const generateAudio = async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    setIsGenerating(true);

    try {
      const ctx = audioContext.current;
      const destination = ctx.createMediaStreamDestination();
      const chunks: BlobPart[] = [];

      mediaRecorder.current = new MediaRecorder(destination.stream);
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await onGenerate(audioBlob);
        setIsGenerating(false);
      };

      mediaRecorder.current.start();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(destination);

      const utterance = new SpeechSynthesisUtterance(dialogue.text);
      utterance.voice = availableVoices.find(v => v.name === dialogue.voiceSettings.voice) || null;
      utterance.pitch = dialogue.voiceSettings.pitch;
      utterance.rate = dialogue.voiceSettings.speed;
      utterance.volume = dialogue.voiceSettings.emphasis ?? 1.0;

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
    <div className="p-4 border rounded-lg bg-white space-y-4">
      <h3 className="text-lg font-medium mb-4">Voice Settings</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Voice</label>
          <select
            className="w-full p-2 border rounded"
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
          <label className="block text-sm font-medium mb-1">Pitch</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            className="w-full"
            value={dialogue.voiceSettings.pitch}
            onChange={(e) => onVoiceSettingsChange({
              ...dialogue.voiceSettings,
              pitch: Number(e.target.value)
            })}
          />
          <span className="text-sm">{dialogue.voiceSettings.pitch}</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            className="w-full"
            value={dialogue.voiceSettings.speed}
            onChange={(e) => onVoiceSettingsChange({
              ...dialogue.voiceSettings,
              speed: Number(e.target.value)
            })}
          />
          <span className="text-sm">{dialogue.voiceSettings.speed}x</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Emphasis</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            className="w-full"
            value={dialogue.voiceSettings.emphasis ?? 1}
            onChange={(e) => onVoiceSettingsChange({
              ...dialogue.voiceSettings,
              emphasis: Number(e.target.value)
            })}
          />
          <span className="text-sm">{dialogue.voiceSettings.emphasis ?? 1}</span>
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handlePreview}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          disabled={isGenerating}
        >
          {previewPlaying ? 'Stop Preview' : 'Preview'}
        </button>
        
        <button
          onClick={generateAudio}
          disabled={isGenerating}
          className={`px-4 py-2 text-white rounded ${
            isGenerating ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Audio'}
        </button>
      </div>
    </div>
  );
}