import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playCorrect: () => void;
  playIncorrect: () => void;
  playLevelComplete: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  
  // Ref to global BGM
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Audio pools for sound effects to allow overlapping sounds
  const playSound = (type: 'correct' | 'incorrect' | 'complete') => {
    if (isMuted) return;
    
    let src = '';
    switch (type) {
      case 'correct': src = '/sounds/correct.mp3'; break;
      case 'incorrect': src = '/sounds/incorrect.mp3'; break;
      case 'complete': src = '/sounds/level-complete.mp3'; break;
    }
    
    // In a real scenario we'd use a robust library like howler.js, 
    // but native Audio works for basic needs. We don't block on error if files don't exist yet.
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    bgmRef.current = new Audio('/sounds/quiz-bgm.mp3');
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.2;
    // We don't autoplay immediately because browsers block it without interaction.
    // BGM should start when a level starts.
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <AudioContext.Provider value={{
      isMuted,
      toggleMute,
      playCorrect: () => playSound('correct'),
      playIncorrect: () => playSound('incorrect'),
      playLevelComplete: () => playSound('complete')
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
