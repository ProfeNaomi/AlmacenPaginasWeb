import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultGameLevels, getGameProgress, GameProgress, GameLevel, completeLevel } from '../lib/gameMap';
import { Lock, Star, Play, X, Trophy } from 'lucide-react';
import { CustomAppRenderer } from '../components/apps/AppRegistry';

export default function GameMapViewer() {
  const [progress, setProgress] = useState<GameProgress>({ unlockedLevel: 1, completedLevels: [], stars: {} });
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProgress(getGameProgress());
  }, []);

  // Configuraciones del mapa
  const levels = defaultGameLevels;
  const LEVEL_SPACING_Y = 120;
  const AMPLITUDE_X = 100;
  const START_OFFSET_Y = 100;
  const MAP_HEIGHT = levels.length * LEVEL_SPACING_Y + START_OFFSET_Y * 2;

  // Calculamos las posiciones
  const levelPositions = levels.map((lvl, index) => {
    // ZigZag usando Math.sin
    const xOffset = Math.sin(index * Math.PI * 0.4) * AMPLITUDE_X;
    return {
      level: lvl,
      // Empezamos desde abajo hacia arriba
      y: MAP_HEIGHT - (index * LEVEL_SPACING_Y + START_OFFSET_Y),
      xOffset // Lo usaremos con calc(50% + xOffset)
    };
  });

  // Generar SVG Path para la línea de conexión
  const generatePath = () => {
    if (levelPositions.length === 0) return '';
    let d = `M 50% ${levelPositions[0].y}`;
    
    for (let i = 1; i < levelPositions.length; i++) {
      const prev = levelPositions[i-1];
      const curr = levelPositions[i];
      // Puntos de control para suavizar la curva (Bezier)
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
    if (containerRef.current) {
      const currentPos = levelPositions.find(p => p.level.number === progress.unlockedLevel);
      if (currentPos) {
        // Hacemos scroll suave para que el nivel actual quede visible
        containerRef.current.scrollTo({
          top: currentPos.y - window.innerHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [progress.unlockedLevel, levelPositions]);

  return (
    <div className="flex-1 bg-[#020617] h-full overflow-hidden flex flex-col relative font-sans">
      {/* Fondo espacial decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black opacity-80 pointer-events-none"></div>
      
      {/* Estrellas decorativas de fondo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Contenedor escroleable del mapa */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar"
      >
        <div 
          className="relative w-full max-w-3xl mx-auto"
          style={{ height: `${MAP_HEIGHT}px` }}
        >
          {/* Línea SVG conectora */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))' }}>
            {/* Camino de fondo oscuro */}
            <path 
              d={generatePath()} 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="20" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Camino de progreso brillante (cyan) */}
            <path 
              d={generatePath()} 
              fill="none" 
              stroke="url(#progressGradient)" 
              strokeWidth="10" 
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

            let bgColor = 'bg-slate-800 border-slate-700'; // Bloqueado
            let iconColor = 'text-slate-500';
            let shadow = '';

            if (isCompleted) {
              bgColor = 'bg-gradient-to-br from-emerald-400 to-cyan-500 border-white/20';
              iconColor = 'text-white';
              shadow = 'shadow-lg shadow-emerald-500/30';
            } else if (isCurrent) {
              bgColor = 'bg-gradient-to-br from-cyan-400 to-blue-500 border-white text-white animate-pulse-slow';
              iconColor = 'text-white';
              shadow = 'shadow-[0_0_30px_rgba(34,211,238,0.5)]';
            }

            return (
              <div 
                key={level.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                style={{ top: `${y}px`, left: `calc(50% + ${xOffset}px)` }}
              >
                {/* Estrellas (si está completado) */}
                {isCompleted && (
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-800 text-slate-700'}`} />
                    ))}
                  </div>
                )}

                {/* Avatar flotante si es el actual */}
                {isCurrent && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: -10, opacity: 1 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                    className="absolute -top-16 bg-white p-1 rounded-full shadow-xl shadow-cyan-500/50 z-20"
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
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${bgColor} ${shadow} ${isUnlocked ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                >
                  {isCompleted ? (
                    <span className="text-xl font-bold font-display">{level.number}</span>
                  ) : isCurrent ? (
                    <Play className={`w-6 h-6 ${iconColor} fill-current`} />
                  ) : (
                    <Lock className={`w-5 h-5 ${iconColor}`} />
                  )}
                </button>

                {/* Tooltip con título del nivel */}
                <div className="absolute top-full mt-2 w-max max-w-[150px] text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-slate-900 border border-slate-700 text-xs font-bold text-white px-3 py-1.5 rounded-lg shadow-xl">
                    Nivel {level.number}
                    <div className="text-slate-400 font-normal truncate mt-0.5">{level.title}</div>
                  </div>
                </div>
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
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                      Desafío {selectedLevel.number}
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
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex flex-col">
                {selectedLevel.type === 'app' && selectedLevel.appComponentName ? (
                   // Cargamos la aplicación dinámica interactiva
                   <CustomAppRenderer name={selectedLevel.appComponentName} />
                ) : (
                   // Desafío genérico PAES / Quiz
                   <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center rotate-3 shadow-xl">
                        <span className="text-4xl font-bold text-white">?</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Pregunta Tipo PAES (Simulada)</h3>
                        <p className="text-slate-400">Si un triángulo rectángulo tiene catetos de largo 3 y 4, ¿cuál es el largo de la hipotenusa?</p>
                      </div>
                      <div className="grid grid-cols-1 w-full gap-3 mt-4">
                        <button className="bg-slate-800 hover:bg-slate-700 text-left px-6 py-4 rounded-xl border border-slate-700 transition-colors">A) 5</button>
                        <button className="bg-slate-800 hover:bg-slate-700 text-left px-6 py-4 rounded-xl border border-slate-700 transition-colors">B) 6</button>
                        <button className="bg-slate-800 hover:bg-slate-700 text-left px-6 py-4 rounded-xl border border-slate-700 transition-colors">C) 7</button>
                      </div>
                   </div>
                )}
              </div>

              {/* Footer / Acción */}
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <button 
                  onClick={() => setSelectedLevel(null)}
                  className="px-6 py-3 font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Volver al Mapa
                </button>
                <button 
                  onClick={handleWin}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Trophy className="w-5 h-5" />
                  Simular Victoria (Completar Nivel)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
