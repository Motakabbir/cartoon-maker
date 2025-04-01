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
      className="absolute"
      style={{
        transform: `translate3d(${animationState.position.x}px, ${animationState.position.y}px, ${animationState.position.z}px) 
                   rotate3d(0, 1, 0, ${animationState.rotation.y}deg)
                   scale(${animationState.scale})`,
        transformOrigin: 'center bottom'
      }}
    >
      <div className="relative w-64 h-64">
        {character.imageUrl && (
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            className="object-contain"
            style={{
              filter: getExpressionFilter(animationState.expression)
            }}
          />
        )}
        
        {/* Lip sync overlay */}
        {animationState.lipsync > 0 && (
          <div
            className="absolute bottom-1/3 left-1/2 w-8 h-8 -translate-x-1/2 bg-contain bg-center bg-no-repeat"
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
      </div>
    </div>
  );
}

function getExpressionFilter(expression: string): string {
  switch (expression) {
    case 'happy':
      return 'brightness(1.2) saturate(1.1)';
    case 'sad':
      return 'brightness(0.9) saturate(0.9)';
    case 'angry':
      return 'brightness(1.1) saturate(1.2) contrast(1.1)';
    case 'surprised':
      return 'brightness(1.15) saturate(1.05)';
    default:
      return 'none';
  }
}

function getGestureEffect(gesture: string): ReactNode {
  switch (gesture) {
    case 'wave':
      return (
        <div className="absolute top-0 right-0 w-12 h-12 animate-wave">
          👋
        </div>
      );
    case 'jump':
      return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-4 bg-black/10 rounded-full animate-bounce" />
      );
    case 'spin':
      return (
        <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-spin" />
      );
    default:
      return <></>;
  }
}