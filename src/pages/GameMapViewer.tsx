import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultGameLevels, getGameProgress, GameProgress, GameLevel, completeLevel, getWorldBackgrounds, getDirectImageUrl } from '../lib/gameMap';
import { Lock, Star, Play, X, Trophy, Skull } from 'lucide-react';
import { CustomAppRenderer } from '../components/apps/AppRegistry';

export default function GameMapViewer() {
  const [progress, setProgress] = useState<GameProgress>({ unlockedLevel: 1, completedLevels: [], stars: {} });
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [customBackgrounds, setCustomBackgrounds] = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Para hacer la curva adaptativa según el tamaño de la pantalla
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    setProgress(getGameProgress());
    setCustomBackgrounds(getWorldBackgrounds());

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configuraciones del mapa para proporción rectangular reducida
  const levels = defaultGameLevels;
  
  // Agrupamos por mundo (10 niveles por mundo)
  const WORLDS_COUNT = 20;
  const LEVELS_PER_WORLD = 10;
  const WORLD_HEIGHT = 750; // Reducido un 30% aprox desde 1080px para ver más niveles a la vez
  const LEVEL_SPACING_Y = 60; // Separación fija entre niveles
  const WORLD_PADDING_Y = (WORLD_HEIGHT - ((LEVELS_PER_WORLD - 1) * LEVEL_SPACING_Y)) / 2; // Padding de 105px arriba y abajo
  
  // Amplitud dinámica: máximo 450px o la mitad de la pantalla menos un margen seguro, para esparcirse lo más posible
  const AMPLITUDE_X = Math.min(450, (windowWidth / 2) - 80); 
  
  const START_OFFSET_Y = 150;
  const MAP_HEIGHT = WORLDS_COUNT * WORLD_HEIGHT + START_OFFSET_Y * 2;

  // Calculamos las posiciones (Nivel 1 abajo, Nivel 200 arriba)
  const levelPositions = useMemo(() => {
    return levels.map((lvl, index) => {
      const worldIndex = Math.floor(index / LEVELS_PER_WORLD);
      const indexInWorld = index % LEVELS_PER_WORLD; 
      
      const yOffsetInWorld = WORLD_PADDING_Y + indexInWorld * LEVEL_SPACING_Y;
      const absoluteY = worldIndex * WORLD_HEIGHT + yOffsetInWorld;

      // Senoide de ciclo completo, combinada con otra onda menor para darle aspecto orgánico de "S"
      const xOffset = Math.sin((indexInWorld / 9) * Math.PI * 2) * AMPLITUDE_X + Math.sin(indexInWorld * 1.5) * 40;
      
      return {
        level: lvl,
        y: MAP_HEIGHT - (absoluteY + START_OFFSET_Y),
        xOffset
      };
    });
  }, [levels, AMPLITUDE_X, MAP_HEIGHT, LEVEL_SPACING_Y, WORLD_PADDING_Y]);

  // Generar SVG Path para la línea de conexión
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

  const handleLevelClick = (lvl: GameLevel) => {
    if (lvl.number <= progress.unlockedLevel) {
      setSelectedLevel(lvl);
    }
  };

  const handleWin = () => {
    if (selectedLevel) {
      const newProgress = completeLevel(selectedLevel.number, 3);
      setProgress(newProgress);
      setSelectedLevel(null);
    }
  };

  // Scroll automático hacia el nivel actual
  useEffect(() => {
    const scrollToLevel = () => {
      if (containerRef.current && levelPositions.length > 0) {
        const currentPos = levelPositions.find(p => p.level.number === progress.unlockedLevel);
        if (currentPos) {
          containerRef.current.scrollTo({
            top: currentPos.y - window.innerHeight / 2,
            behavior: 'auto' // Instantáneo al cargar para no ver los niveles superiores
          });
        }
      }
    };
    
    // Ejecutar inmediatamente y con un pequeño delay por si la UI se re-dibuja
    scrollToLevel();
    const timeout = setTimeout(scrollToLevel, 300);
    return () => clearTimeout(timeout);
  }, [progress.unlockedLevel, levelPositions]);

  return (
    <div className="flex-1 bg-[#020617] h-full overflow-hidden flex flex-col relative font-sans">
      
      {/* Contenedor escroleable del mapa */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar"
      >
        <div 
          className="relative w-full mx-auto shadow-2xl"
          style={{ height: `${MAP_HEIGHT}px` }}
        >
          {/* Fondos de los Mundos (Renderizados con posición absoluta para permitir solapamiento y crossfade) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
             {Array.from({ length: WORLDS_COUNT }).map((_, i) => {
               const worldId = WORLDS_COUNT - i; // Mundo 20 arriba, Mundo 1 abajo
               
               // Priorizamos el fondo subido por el admin, sino usamos el reciclado
               const customBg = customBackgrounds[worldId];
               const fallbackImageId = ((worldId - 1) % 7) + 1;
               const finalImageUrl = customBg ? getDirectImageUrl(customBg) : `/worlds/clean_world_${fallbackImageId}.png`;

               const OVERLAP = 250; // 250px de superposición para un crossfade muy suave
               
               // La posición "teórica" sin solapamiento
               const theoreticalTop = i === 0 ? 0 : START_OFFSET_Y + i * WORLD_HEIGHT;
               const theoreticalHeight = (i === 0 || i === WORLDS_COUNT - 1) ? WORLD_HEIGHT + START_OFFSET_Y : WORLD_HEIGHT;

               // Extendemos la imagen hacia arriba y hacia abajo para el solapamiento
               const top = i === 0 ? theoreticalTop : theoreticalTop - OVERLAP / 2;
               const height = theoreticalHeight + (i === 0 ? 0 : OVERLAP / 2) + (i === WORLDS_COUNT - 1 ? 0 : OVERLAP / 2);

               // Creamos una máscara de desvanecimiento
               const maskTop = i === 0 ? 'black 0%' : `transparent 0%, black ${OVERLAP}px`;
               const maskBottom = i === WORLDS_COUNT - 1 ? 'black 100%' : `black calc(100% - ${OVERLAP}px), transparent 100%`;
               const maskImage = `linear-gradient(to bottom, ${maskTop}, ${maskBottom})`;

               return (
                 <div 
                   key={worldId}
                   className="absolute w-full bg-cover bg-center bg-no-repeat"
                   style={{ 
                     top: `${top}px`,
                     height: `${height}px`,
                     backgroundImage: `url(${finalImageUrl})`,
                     WebkitMaskImage: maskImage,
                     maskImage: maskImage
                   }}
                 >
                   {/* Un ligero oscurecimiento en general para que contraste el camino luminoso */}
                   <div className="absolute inset-0 bg-[#020617]/20"></div>
                 </div>
               );
             })}
          </div>

          {/* Línea SVG conectora (Centro de la pantalla) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }}>
            <path 
              d={generatePath()} 
              fill="none" 
              stroke="rgba(0,0,0,0.6)" 
              strokeWidth="28" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            <path 
              d={generatePath()} 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="18" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Camino de progreso brillante (cyan) */}
            <path 
              d={generatePath()} 
              fill="none" 
              stroke="url(#progressGradient)" 
              strokeWidth="12" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeDasharray="20, 20"
              className="animate-[dash_3s_linear_infinite]"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash {
              to {
                stroke-dashoffset: -40;
              }
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}} />

          {/* Nodos de los niveles */}
          {levelPositions.map(({ level, y, xOffset }) => {
            const isUnlocked = level.number <= progress.unlockedLevel;
            const isCompleted = progress.completedLevels.includes(level.number);
            const isCurrent = level.number === progress.unlockedLevel;
            const stars = progress.stars[level.number] || 0;
            const isBoss = level.isBoss;

            let bgColor = 'bg-slate-800 border-slate-600'; // Bloqueado
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
              shadow = isBoss ? 'shadow-[0_0_50px_rgba(239,68,68,0.8)]' : 'shadow-[0_0_30px_rgba(34,211,238,0.6)]';
            }

            return (
              <div 
                key={level.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                style={{ top: `${y}px`, left: `calc(50% + ${xOffset}px)` }}
              >
                {/* Estrellas (si está completado) */}
                {isCompleted && !isBoss && (
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-800 text-slate-700'}`} />
                    ))}
                  </div>
                )}
                
                {isBoss && isCompleted && (
                   <div className="mb-2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                     MUNDO {level.worldId} COMPLETADO
                   </div>
                )}

                {/* Avatar flotante si es el actual */}
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

                {/* Botón del Nodo */}
                <button
                  onClick={() => handleLevelClick(level)}
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

                {/* Etiqueta siempre visible para jefes */}
                {isBoss && (
                  <div className="mt-3 bg-slate-900/90 border border-slate-700 text-white font-bold px-4 py-2 rounded-xl shadow-xl text-center backdrop-blur-sm">
                    {level.title}
                  </div>
                )}

                {/* Tooltip con título del nivel para niveles normales */}
                {!isBoss && (
                  <div className="absolute top-full mt-2 w-max max-w-[180px] text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    <div className="bg-slate-900/95 border border-slate-700 text-xs font-bold text-white px-3 py-2 rounded-xl shadow-xl backdrop-blur-sm">
                      Nivel {level.number}
                      <div className="text-cyan-400 font-normal truncate mt-0.5">{level.title}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal del Desafío */}
      <AnimatePresence>
        {selectedLevel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`bg-slate-900 border ${selectedLevel.isBoss ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'border-slate-800'} rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative`}
            >
              
              {/* Boss Decorator */}
              {selectedLevel.isBoss && (
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
              )}

              {/* Header Modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`${selectedLevel.isBoss ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'} text-xs font-bold px-2 py-1 rounded uppercase tracking-wider`}>
                      {selectedLevel.isBoss ? '¡JEFE DE MUNDO!' : `Desafío ${selectedLevel.number}`}
                    </span>
                    {progress.completedLevels.includes(selectedLevel.number) && (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold uppercase tracking-wider bg-yellow-400/10 px-2 py-1 rounded">
                        <Trophy className="w-3 h-3" /> Completado
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold font-display text-white">{selectedLevel.title}</h2>
                  <p className="text-slate-400 text-sm mt-1">{selectedLevel.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedLevel(null)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del Desafío */}
              <div className="flex-1 overflow-y-auto p-0 bg-slate-950 flex flex-col relative rounded-b-3xl">
                {/* Background watermark for boss */}
                {selectedLevel.isBoss && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                     <Skull className="w-96 h-96 text-red-500" />
                   </div>
                )}

                {selectedLevel.type === 'app' && selectedLevel.appComponentName ? (
                   // Cargamos la aplicación dinámica interactiva
                   <CustomAppRenderer 
                     name={selectedLevel.appComponentName} 
                     onWin={handleWin}
                     onClose={() => setSelectedLevel(null)}
                   />
                ) : (
                   // Desafío genérico PAES / Quiz
                   <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto z-10 p-6">
                      <div className={`w-24 h-24 ${selectedLevel.isBoss ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-500/50' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/50'} rounded-2xl flex items-center justify-center rotate-3 shadow-xl`}>
                        <span className="text-4xl font-bold text-white">?</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Pregunta de Nivel {selectedLevel.worldId}</h3>
                        <p className="text-slate-400">Este desafío pondrá a prueba tus conocimientos sobre {selectedLevel.worldId === 1 ? 'Números Naturales' : selectedLevel.worldId === 2 ? 'Geometría Básica' : 'Matemáticas'}.</p>
                      </div>
                      <div className="grid grid-cols-1 w-full gap-3 mt-4">
                        <button className="bg-slate-800 hover:bg-slate-700 text-left px-6 py-4 rounded-xl border border-slate-700 transition-colors">A) Opción 1</button>
                        <button className="bg-slate-800 hover:bg-slate-700 text-left px-6 py-4 rounded-xl border border-slate-700 transition-colors">B) Opción 2</button>
                        <button className="bg-slate-800 hover:bg-slate-700 text-left px-6 py-4 rounded-xl border border-slate-700 transition-colors">C) Opción 3</button>
                      </div>
                   </div>
                )}
              </div>

              {/* Footer / Acción (Solo para Quiz normal) */}
              {selectedLevel.type !== 'app' && (
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center z-10">
                  <button 
                    onClick={() => setSelectedLevel(null)}
                    className="px-6 py-3 font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Huir cobardemente
                  </button>
                  <button 
                    onClick={handleWin}
                    className={`px-8 py-3 bg-gradient-to-r ${selectedLevel.isBoss ? 'from-red-500 to-orange-500 shadow-red-500/30 hover:from-red-400 hover:to-orange-400' : 'from-emerald-500 to-cyan-500 shadow-cyan-500/30 hover:from-emerald-400 hover:to-cyan-400'} text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2`}
                  >
                    <Trophy className="w-5 h-5" />
                    Simular Victoria (Ganar Nivel)
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
