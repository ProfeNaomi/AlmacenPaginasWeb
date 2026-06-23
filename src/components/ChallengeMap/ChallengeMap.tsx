import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Star, Play, X, Trophy, Skull } from 'lucide-react';
import { GameLevel, GameProgress, getDirectImageUrl } from '../../lib/gameMap';

interface ChallengeMapProps {
  levels: GameLevel[];
  progress: GameProgress;
  customBackgrounds: Record<number, string>;
  onLevelClick: (level: GameLevel) => void;
}

export default function ChallengeMap({ levels, progress, customBackgrounds, onLevelClick }: ChallengeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const WORLDS_COUNT = 20;
  const LEVELS_PER_WORLD = 10;
  const WORLD_HEIGHT = 1200; 
  const LEVEL_SPACING_Y = 110; 
  const WORLD_PADDING_Y = (WORLD_HEIGHT - ((LEVELS_PER_WORLD - 1) * LEVEL_SPACING_Y)) / 2;
  const AMPLITUDE_X = Math.min(450, (windowWidth / 2) - 80); 
  const START_OFFSET_Y = 150;
  const MAP_HEIGHT = WORLDS_COUNT * WORLD_HEIGHT + START_OFFSET_Y * 2;

  const levelPositions = useMemo(() => {
    return levels.map((lvl, index) => {
      const worldIndex = Math.floor(index / LEVELS_PER_WORLD);
      const indexInWorld = index % LEVELS_PER_WORLD; 
      
      const yOffsetInWorld = WORLD_PADDING_Y + indexInWorld * LEVEL_SPACING_Y;
      const absoluteY = worldIndex * WORLD_HEIGHT + yOffsetInWorld;

      const xOffset = Math.sin((indexInWorld / 9) * Math.PI * 2) * AMPLITUDE_X + Math.sin(indexInWorld * 1.5) * 40;
      
      return {
        level: lvl,
        y: MAP_HEIGHT - (absoluteY + START_OFFSET_Y),
        xOffset
      };
    });
  }, [levels, AMPLITUDE_X, MAP_HEIGHT, LEVEL_SPACING_Y, WORLD_PADDING_Y]);

  const generatePath = () => {
    if (levelPositions.length === 0) return '';
    let d = `M 50% ${levelPositions[0].y}`;
    
    for (let i = 1; i < levelPositions.length; i++) {
      const prev = levelPositions[i-1];
      const curr = levelPositions[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C calc(50% + ${prev.xOffset}px) ${midY}, calc(50% + ${curr.xOffset}px) ${midY}, calc(50% + ${curr.xOffset}px) ${curr.y}`;
    }
    return d;
  };

  useEffect(() => {
    const scrollToLevel = () => {
      if (containerRef.current && levelPositions.length > 0) {
        const currentPos = levelPositions.find(p => p.level.number === progress.unlockedLevel);
        if (currentPos) {
          containerRef.current.scrollTo({
            top: currentPos.y - window.innerHeight / 2,
            behavior: 'auto'
          });
        }
      }
    };
    
    scrollToLevel();
    const timeout = setTimeout(scrollToLevel, 300);
    return () => clearTimeout(timeout);
  }, [progress.unlockedLevel, levelPositions]);

  return (
    <div className="flex-1 bg-slate-950 h-full overflow-hidden flex flex-col relative font-sans">
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar">
        <div className="relative w-full mx-auto shadow-2xl" style={{ height: `${MAP_HEIGHT}px` }}>
          
          {/* Fondos de Mundos */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
             {Array.from({ length: WORLDS_COUNT }).map((_, i) => {
               const worldId = WORLDS_COUNT - i;
               const customBg = customBackgrounds[worldId];
               const fallbackImageId = ((worldId - 1) % 7) + 1;
               const finalImageUrl = customBg ? getDirectImageUrl(customBg) : `/worlds/clean_world_${fallbackImageId}.png`;
               const OVERLAP = 250;
               const theoreticalTop = i === 0 ? 0 : START_OFFSET_Y + i * WORLD_HEIGHT;
               const theoreticalHeight = (i === 0 || i === WORLDS_COUNT - 1) ? WORLD_HEIGHT + START_OFFSET_Y : WORLD_HEIGHT;
               const top = i === 0 ? theoreticalTop : theoreticalTop - OVERLAP / 2;
               const height = theoreticalHeight + (i === 0 ? 0 : OVERLAP / 2) + (i === WORLDS_COUNT - 1 ? 0 : OVERLAP / 2);
               const maskTop = i === 0 ? 'black 0%' : `transparent 0%, black ${OVERLAP}px`;
               const maskBottom = i === WORLDS_COUNT - 1 ? 'black 100%' : `black calc(100% - ${OVERLAP}px), transparent 100%`;
               const maskImage = `linear-gradient(to bottom, ${maskTop}, ${maskBottom})`;

               return (
                 <div key={worldId} className="absolute w-full bg-cover bg-center bg-no-repeat"
                   style={{ 
                     top: `${top}px`, height: `${height}px`, backgroundImage: `url(${finalImageUrl})`,
                     WebkitMaskImage: maskImage, maskImage: maskImage
                   }}>
                   <div className="absolute inset-0 bg-[#020617]/40 backdrop-blur-[2px]"></div>
                 </div>
               );
             })}
          </div>

          {/* Línea Conectora SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }}>
            <path d={generatePath()} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
            <path d={generatePath()} fill="none" stroke="#334155" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 15" />
            <path d={generatePath()} fill="none" stroke="url(#progressGradient)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20, 20" className="animate-[dash_3s_linear_infinite]" />
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash { to { stroke-dashoffset: -40; } }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {/* Nodos */}
          {levelPositions.map(({ level, y, xOffset }, index) => {
            const isUnlocked = level.number <= progress.unlockedLevel;
            const isCompleted = progress.completedLevels.includes(level.number);
            const isCurrent = level.number === progress.unlockedLevel;
            const isBoss = level.isBoss;

            let bgColor = 'bg-slate-800 border-slate-600'; 
            let iconColor = 'text-slate-400';
            let shadow = 'shadow-md';
            let sizeClass = isBoss ? 'w-24 h-24 border-8' : 'w-16 h-16 border-4';

            if (isCompleted) {
              bgColor = isBoss ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-white' : 'bg-gradient-to-br from-emerald-400 to-cyan-500 border-white';
              iconColor = 'text-white';
              shadow = isBoss ? 'shadow-[0_0_40px_rgba(245,158,11,0.6)]' : 'shadow-lg shadow-emerald-500/50';
            } else if (isCurrent) {
              bgColor = isBoss ? 'bg-gradient-to-br from-red-500 to-rose-600 border-white animate-pulse-slow' : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-white animate-pulse-slow';
              iconColor = 'text-white';
              shadow = isBoss ? 'shadow-[0_0_30px_rgba(34,211,238,0.6)]' : 'shadow-[0_0_30px_rgba(34,211,238,0.6)]';
            }

            return (
              <motion.div 
                key={level.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                style={{ top: `${y}px`, left: `calc(50% + ${xOffset}px)` }}
              >
                {isCurrent && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: -10, opacity: 1 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                    className={`absolute ${isBoss ? '-top-20' : '-top-16'} bg-white p-1 rounded-full shadow-xl shadow-cyan-500/50 z-20`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-white border-2 border-slate-900">
                      Tú
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={() => onLevelClick(level)}
                  disabled={!isUnlocked}
                  className={`${sizeClass} rounded-full flex items-center justify-center transition-all duration-300 ${bgColor} ${shadow} ${isUnlocked ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'opacity-80 cursor-not-allowed filter grayscale'}`}
                >
                  {isBoss && !isCompleted && isUnlocked ? (
                     <Skull className={`w-10 h-10 ${iconColor} animate-bounce`} />
                  ) : isBoss && isCompleted ? (
                     <Trophy className={`w-10 h-10 ${iconColor}`} />
                  ) : isCompleted ? (
                    <span className="text-2xl font-bold font-display">{level.number}</span>
                  ) : isCurrent ? (
                    <Play className={`w-6 h-6 ${iconColor} fill-current`} />
                  ) : (
                    <Lock className={`w-5 h-5 ${iconColor}`} />
                  )}
                </button>

                {isBoss && (
                  <div className="mt-3 bg-slate-900/90 border border-slate-700 text-white font-bold px-4 py-2 rounded-xl shadow-xl text-center backdrop-blur-sm">
                    {level.title}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
