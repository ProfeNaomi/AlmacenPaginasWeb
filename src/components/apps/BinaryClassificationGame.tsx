import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface BinaryClassificationGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

// Opciones de frutas (Rojo vs Amarillo)
const RED_FRUITS = ['🍎'];
const YELLOW_FRUITS = ['🍌'];

interface Item {
  id: string;
  emoji: string;
  category: 'red' | 'yellow';
}

const generateItems = (count: number): Item[] => {
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const isRed = Math.random() > 0.5;
    const emojiList = isRed ? RED_FRUITS : YELLOW_FRUITS;
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    items.push({
      id: `item-${Date.now()}-${i}`,
      emoji,
      category: isRed ? 'red' : 'yellow'
    });
  }
  return items;
};

export default function BinaryClassificationGame({ onWin, onClose }: BinaryClassificationGameProps) {
  const [itemsQueue, setItemsQueue] = useState<Item[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [flash, setFlash] = useState<'none' | 'correct' | 'wrong'>('none');
  
  const targetScore = 40;

  // Inicializar juego
  const startGame = useCallback(() => {
    setItemsQueue(generateItems(100)); // Cola suficientemente grande
    setCorrectCount(0);
    setTimeLeft(60);
    setGameState('playing');
    setFlash('none');
  }, []);

  // Manejo de Sonidos (similar al de Contra Reloj)
  const playSound = useCallback((type: 'correct' | 'wrong') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.log("Audio no soportado");
    }
  }, []);

  // Temporizador
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft <= 0 && gameState === 'playing') {
      setGameState('lost');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Manejo de la lógica de clasificación
  const handleClassification = useCallback((selectedCategory: 'red' | 'yellow') => {
    if (gameState !== 'playing' || itemsQueue.length === 0) return;

    const currentItem = itemsQueue[0];
    const isCorrect = currentItem.category === selectedCategory;

    if (isCorrect) {
      playSound('correct');
      setFlash('correct');
      const newScore = correctCount + 1;
      setCorrectCount(newScore);
      
      if (newScore >= targetScore) {
        setGameState('won');
        if (onWin) setTimeout(onWin, 1500);
      }
    } else {
      playSound('wrong');
      setFlash('wrong');
      setTimeLeft(prev => Math.max(0, prev - 1)); // Penalización -1 segundo
    }

    // Avanzar la cola
    setItemsQueue(prev => prev.slice(1));
    
    // Si nos quedamos sin items en la cola (por seguridad, añadimos más)
    if (itemsQueue.length < 10) {
      setItemsQueue(prev => [...prev, ...generateItems(20)]);
    }

    // Quitar flash rápido
    setTimeout(() => {
      setFlash('none');
    }, 200);

  }, [gameState, itemsQueue, correctCount, targetScore, playSound, onWin]);

  // Controles de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft') {
        handleClassification('red');
      } else if (e.key === 'ArrowRight') {
        handleClassification('yellow');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleClassification]);

  // Pantalla Inicial
  if (gameState === 'idle') {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-900 text-slate-100 rounded-2xl relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md relative z-10"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-500 to-yellow-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg shadow-rose-500/20">
            ⚖️
          </div>
          <h2 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-yellow-400 font-display">
            Clasificación Binaria
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            ¡Clasifica rápido! Envía a la <span className="text-rose-400 font-bold">Izquierda</span> las Manzanas Rojas y a la <span className="text-yellow-400 font-bold">Derecha</span> los Plátanos.
          </p>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-8 flex justify-center gap-6">
            <div className="text-center">
              <span className="text-2xl block mb-2">⬅️</span>
              <span className="text-sm text-rose-400">Rojas</span>
            </div>
            <div className="text-center">
              <span className="text-2xl block mb-2">➡️</span>
              <span className="text-sm text-yellow-400">Amarillos</span>
            </div>
          </div>
          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-xl font-bold text-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
          >
            ¡Empezar a Clasificar!
          </button>
          {onClose && (
            <button onClick={onClose} className="mt-4 text-slate-500 hover:text-slate-300 font-medium">
              Volver al Mapa
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // Colores dinámicos del fondo según flash
  const bgClass = flash === 'correct' ? 'bg-emerald-950' : flash === 'wrong' ? 'bg-red-950' : 'bg-slate-950';

  return (
    <div className={`w-full h-full min-h-[500px] flex flex-col p-4 md:p-6 text-slate-100 rounded-2xl relative transition-colors duration-150 ${bgClass} overflow-hidden`}>
      
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 z-10">
        <button onClick={onClose} className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-6 bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700/50">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Progreso</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {correctCount} <span className="text-slate-500 text-lg">/ {targetScore}</span>
            </span>
          </div>
          <div className="w-[1px] h-10 bg-slate-700"></div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Tiempo</span>
            <span className={`text-2xl font-mono font-bold flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
              <Clock size={20} className={timeLeft <= 10 ? 'animate-bounce' : ''} /> {timeLeft}s
            </span>
          </div>
        </div>

        <button onClick={startGame} className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-8 shadow-inner z-10">
        <motion.div 
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (correctCount / targetScore) * 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Game Area */}
      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          
          {/* Clasificadores y Cola */}
          <div className="w-full max-w-3xl flex justify-between items-end relative h-64 border-b-4 border-slate-700 pb-4">
            
            {/* Canasto Izquierdo */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => handleClassification('red')}
              className="w-32 h-32 md:w-40 md:h-40 bg-rose-900/50 border-4 border-rose-500 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)] backdrop-blur-sm"
            >
              <ArrowLeft size={40} className="text-rose-400 mb-2" />
              <span className="font-bold text-rose-200">ROJO</span>
            </motion.button>

            {/* Cinta Transportadora / Cola en el centro */}
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 flex items-center justify-center h-full pt-10">
              <div className="relative flex flex-col items-center">
                {/* Elementos en Cola (se muestran los próximos 4) */}
                <div className="flex flex-col-reverse items-center justify-end h-[300px] gap-4 w-24 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 40%, black)' }}>
                  <AnimatePresence>
                    {itemsQueue.slice(0, 4).map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -50, scale: 0.5 }}
                        animate={{ 
                          opacity: index === 0 ? 1 : 0.6 - (index * 0.15), 
                          y: 0, 
                          scale: index === 0 ? 1.5 : 1 - (index * 0.15),
                          filter: index === 0 ? 'blur(0px)' : `blur(${index}px)`
                        }}
                        exit={{ opacity: 0, y: 50, scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`text-6xl ${index === 0 ? 'z-20 drop-shadow-2xl' : 'z-10'}`}
                        style={{ marginTop: index === 0 ? 'auto' : '0' }}
                      >
                        {item.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Base "Mesa" donde cae el actual */}
                <div className="w-32 h-8 bg-slate-700/80 mt-6 rounded-full border-t border-slate-500 flex items-center justify-center shadow-lg">
                   <div className="w-16 h-2 bg-slate-900 rounded-full opacity-50"></div>
                </div>
              </div>
            </div>

            {/* Canasto Derecho */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => handleClassification('yellow')}
              className="w-32 h-32 md:w-40 md:h-40 bg-yellow-900/50 border-4 border-yellow-500 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-sm"
            >
              <ArrowRight size={40} className="text-yellow-400 mb-2" />
              <span className="font-bold text-yellow-200">AMARILLO</span>
            </motion.button>

          </div>

          <p className="mt-8 text-slate-400 font-medium text-center">
            Usa las flechas <kbd className="bg-slate-800 px-2 py-1 rounded text-slate-200 border border-slate-600">←</kbd> y <kbd className="bg-slate-800 px-2 py-1 rounded text-slate-200 border border-slate-600">→</kbd> de tu teclado o toca los paneles.
          </p>
        </div>
      )}

      {/* Pantallas de Fin de Juego */}
      <AnimatePresence>
        {(gameState === 'won' || gameState === 'lost') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
          >
            {gameState === 'won' ? (
              <>
                <div className="text-6xl mb-6 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">⭐⭐⭐</div>
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 font-display">
                  ¡Nivel Completado!
                </h2>
                <p className="text-emerald-100 text-xl max-w-md mb-8">
                  ¡Excelente reflejo! Clasificaste todas las frutas a una velocidad impresionante.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">⏱️</div>
                <h2 className="text-5xl font-black text-red-400 mb-4 font-display">¡Tiempo Agotado!</h2>
                <p className="text-red-200 text-xl max-w-md mb-8">
                  Te faltaron {targetScore - correctCount} frutas para completar el objetivo. ¡La próxima vez lo harás más rápido!
                </p>
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw size={20} /> Reintentar
              </button>
              {gameState === 'won' && onClose && (
                <button
                  onClick={onClose}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-xl font-bold text-lg transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
                >
                  Continuar al Mapa <ArrowRight size={20} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
