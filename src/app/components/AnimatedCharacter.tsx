'use client';

import { Character } from '../types/character';
import { Action } from '../types/animation';
import { useAnimation } from '../hooks/useAnimation';
import Image from 'next/image';
import { ReactNode } from 'react';

interface AnimatedCharacterProps {
  character: Character;
  actions: Action[];
  currentTime: number;
  sceneStartTime: number;
}

export default function AnimatedCharacter({
  character,
  actions,
  currentTime,
  sceneStartTime
}: AnimatedCharacterProps) {
  const animationState = useAnimation(actions, currentTime, sceneStartTime);

  return (
    <div
      className="absolute transition-all duration-300 ease-out"
      style={{
        transform: `translate3d(${animationState.position.x}px, ${animationState.position.y}px, ${animationState.position.z}px) 
                   rotate3d(0, 1, 0, ${animationState.rotation.y}deg)
                   scale(${animationState.scale})`,
        transformOrigin: 'center bottom'
      }}
    >
      <div className="relative w-64 h-64 group">
        {character.imageUrl && (
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            className="object-contain transition-all duration-300"
            style={{
              filter: `${getExpressionFilter(animationState.expression)} drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))`,
              transform: animationState.gesture === 'jump' ? 'translateY(-20px)' : 'none'
            }}
          />
        )}
        
        {/* Character name tooltip */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap">
            {character.name}
          </div>
          <div className="w-2 h-2 bg-purple-600 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
        
        {/* Lip sync overlay */}
        {animationState.lipsync > 0 && (
          <div
            className="absolute bottom-1/3 left-1/2 w-8 h-8 -translate-x-1/2 bg-contain bg-center bg-no-repeat transition-opacity duration-100"
            style={{
              backgroundImage: 'url(/mouth-shapes.png)',
              backgroundPosition: `${Math.floor(animationState.lipsync * 7) * 100/7}% 0`,
              opacity: 0.8
            }}
          />
        )}

        {/* Gesture effect */}
        {animationState.gesture !== 'idle' && (
          <div className="absolute inset-0 pointer-events-none">
            {getGestureEffect(animationState.gesture)}
          </div>
        )}

        {/* Expression indicator */}
        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-white shadow-lg rounded-full p-2 text-lg">
            {getExpressionEmoji(animationState.expression)}
          </div>
        </div>
      </div>
    </div>
  );
}

function getExpressionFilter(expression: string): string {
  switch (expression) {
    case 'happy':
      return 'brightness(1.2) saturate(1.1)';
    case 'sad':
      return 'brightness(0.9) saturate(0.9) hue-rotate(-10deg)';
    case 'angry':
      return 'brightness(1.1) saturate(1.2) contrast(1.1) hue-rotate(5deg)';
    case 'surprised':
      return 'brightness(1.15) saturate(1.05)';
    case 'scared':
      return 'brightness(0.95) saturate(0.9) hue-rotate(-5deg)';
    case 'disgusted':
      return 'brightness(1.05) saturate(1.1) hue-rotate(5deg)';
    default:
      return 'none';
  }
}

function getExpressionEmoji(expression: string): string {
  switch (expression) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'angry':
      return '😠';
    case 'surprised':
      return '😮';
    case 'scared':
      return '😨';
    case 'disgusted':
      return '🤢';
    default:
      return '😐';
  }
}

function getGestureEffect(gesture: string): ReactNode {
  switch (gesture) {
    case 'wave':
      return (
        <div className="absolute top-0 right-0 animate-bounce">
          <div className="text-2xl transform -rotate-45">👋</div>
          <div className="absolute top-0 right-0 w-8 h-8 border-2 border-purple-300 rounded-full animate-ping opacity-75" />
        </div>
      );
    case 'jump':
      return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full">
          <div className="w-16 h-4 bg-black/10 rounded-full animate-pulse mx-auto" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8">
            <div className="w-full h-full border-b-4 border-purple-300 rounded-full animate-bounce" />
          </div>
        </div>
      );
    case 'spin':
      return (
        <>
          <div className="absolute inset-0 border-2 border-purple-300/30 rounded-full animate-[spin_2s_linear_infinite]" />
          <div className="absolute inset-2 border-2 border-purple-400/20 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
        </>
      );
    case 'dance':
      return (
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 text-purple-400">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-current rounded-full"
                  style={{
                    animation: `dance 1s ease-in-out ${i * 0.25}s infinite`,
                    transform: `rotate(${i * 90}deg) translateX(16px)`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}