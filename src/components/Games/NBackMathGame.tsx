import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, Play } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface NBackMathGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function NBackMathGame({ onWin, onClose }: NBackMathGameProps) {
  const { playSound } = useAudio();
  const [history, setHistory] = useState<number[]>([]);
  const [currentNum, setCurrentNum] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetScore = 8;
  const N = 2; // 2-Back

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setLives(3);
    setHistory([]);
    setCurrentNum(null);
  };

  useEffect(() => {
    if (!isPlaying || gameOver || win) return;

    const intervalId = setInterval(() => {
      setCurrentNum(prevNum => {
        let nextNum: number;
        // 30% chance to intentionally create a match
        if (history.length >= N && Math.random() < 0.3) {
          nextNum = history[history.length - N];
        } else {
          nextNum = Math.floor(Math.random() * 9) + 1;
        }
        
        setHistory(h => [...h, nextNum]);
        return nextNum;
      });

      // Hide number after 1 second to create the memory effect
      setTimeout(() => {
        setCurrentNum(null);
      }, 1000);

    }, 2500);

    return () => clearInterval(intervalId);
  }, [isPlaying, gameOver, win, history]);

  const handleMatchPress = () => {
    if (!isPlaying || gameOver || win || currentNum === null) return;

    if (history.length > N) {
      const nBackNum = history[history.length - 1 - N]; // -1 because currentNum is already in history at the end
      if (currentNum === nBackNum) {
        playSound('success');
        setScore(s => {
          if (s + 1 >= targetScore) {
            setWin(true);
            setTimeout(() => onWin?.(), 2000);
          }
          return s + 1;
        });
      } else {
        playSound('error');
        setLives(l => {
          if (l - 1 <= 0) setGameOver(true);
          return l - 1;
        });
      }
    } else {
      // Cannot have a match yet
      playSound('error');
      setLives(l => {
        if (l - 1 <= 0) setGameOver(true);
        return l - 1;
      });
    }
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 items-center justify-center relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Coincide (N-Back)"
            instructions={`Aparecerán números en la pantalla uno por uno.\n\nDebes presionar '¡COINCIDE!' ÚNICAMENTE cuando el número actual sea EXACTAMENTE IGUAL al que apareció hace 2 turnos.\n\nSi te equivocas, perderás una vida.`}
            onStart={() => {
               setShowInstructions(false);
               startGame();
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <Heart key={i} className={`w-6 h-6 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800'} transition-all`} />
          ))}
        </div>
        <div className="text-cyan-400 font-bold text-xl">
          Puntaje {score}/{targetScore}
        </div>
      </div>

      {(!isPlaying && !gameOver && !win && !showInstructions) ? (
         null // Se maneja con el modal
      ) : (
        <div className="flex flex-col items-center justify-center w-full">
          {/* Historial Visual (Cinta) */}
          <div className="w-full max-w-md h-20 bg-slate-900 border border-slate-800 rounded-2xl mb-8 flex items-center justify-end px-4 gap-4 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent z-10 pointer-events-none"></div>
             <span className="absolute left-4 text-slate-600 text-xs font-bold tracking-widest uppercase z-20">Pasado</span>
             {history.slice(-4).map((h, i) => (
                <motion.div key={history.length - i} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: i === history.slice(-4).length - 1 ? 1 : 0.4 }} className="text-2xl font-black text-white w-12 h-12 flex flex-shrink-0 items-center justify-center bg-slate-800 rounded-lg">
                   {h}
                </motion.div>
             ))}
          </div>

          <div className="h-64 flex items-center justify-center w-full relative mb-8">
            <AnimatePresence>
              {currentNum !== null && (
                <motion.div
                  key={history.length}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                  className="absolute text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                >
                  {currentNum}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleMatchPress}
            className="w-full max-w-sm py-8 bg-indigo-600 hover:bg-indigo-500 active:bg-cyan-500 rounded-3xl text-white font-black text-4xl shadow-[0_10px_0_rgba(67,56,202,1)] active:shadow-[0_0px_0_rgba(67,56,202,1)] active:translate-y-2 transition-all"
          >
            ¡COINCIDE!
          </button>
          <p className="text-slate-500 mt-6 font-bold tracking-widest uppercase">
            Solo si es igual al de hace 2 turnos
          </p>
        </div>
      )}

      {/* Status overlays */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
          >
            <div className="bg-slate-900 border border-red-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Desconcentración!</h3>
              <p className="text-slate-300">El N-Back es uno de los tests más difíciles.</p>
              <button onClick={() => { setGameOver(false); startGame(); }}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold mt-6">
                Reintentar
              </button>
            </div>
          </motion.div>
        )}
        
        {win && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
          >
            <div className="bg-slate-900 border border-emerald-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Memoria de Trabajo Nivel Dios!</h3>
              <p className="text-slate-300">Has completado el entrenamiento N-Back con éxito.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
