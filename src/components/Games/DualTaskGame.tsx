import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Clock } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface DualTaskGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

type Task1Item = { id: string; value: number };
type Task2Item = { id: string; type: 'triangle' | 'circle' | 'square' };
type Task3Item = { id: string; color: 'red' | 'blue' | 'green' };

export default function DualTaskGame({ onWin, onClose }: DualTaskGameProps) {
  const { playSound } = useAudio();
  const [showInstructions, setShowInstructions] = useState(true);
  
  const [task1Item, setTask1Item] = useState<Task1Item | null>(null);
  const [task2Item, setTask2Item] = useState<Task2Item | null>(null);
  const [task3Item, setTask3Item] = useState<Task3Item | null>(null);
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  const targetScore = 20;

  // Spawners
  useEffect(() => {
    if (gameOver || win || showInstructions) return;
    
    const t1Interval = setInterval(() => {
      setTask1Item({ id: Math.random().toString(), value: Math.floor(Math.random() * 100) });
    }, 2000);

    const t2Interval = setInterval(() => {
      const types: ('triangle' | 'circle' | 'square')[] = ['triangle', 'circle', 'square'];
      setTask2Item({ id: Math.random().toString(), type: types[Math.floor(Math.random() * types.length)] });
    }, 2500);

    const t3Interval = setInterval(() => {
      const colors: ('red' | 'blue' | 'green')[] = ['red', 'blue', 'green'];
      setTask3Item({ id: Math.random().toString(), color: colors[Math.floor(Math.random() * colors.length)] });
    }, 3000);

    return () => {
      clearInterval(t1Interval);
      clearInterval(t2Interval);
      clearInterval(t3Interval);
    };
  }, [gameOver, win, showInstructions]);

  // Timer
  useEffect(() => {
    if (gameOver || win || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (score < targetScore) setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [score, gameOver, win, showInstructions]);

  const handleAction = (isCorrect: boolean, clearTask: () => void) => {
    if (isCorrect) {
      playSound('success');
      setScore(s => {
        const newScore = s + 1;
        if (newScore >= targetScore) { setWin(true); setTimeout(() => onWin?.(), 2000); }
        return newScore;
      });
    } else {
      playSound('error');
      setScore(s => Math.max(0, s - 1));
    }
    clearTask();
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 overflow-hidden relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Jefe Titán: Multitarea"
            instructions={`¡Prepárate para el caos! Aparecerán estímulos en 3 columnas a la vez.\n\n- Columna 1: Toca el botón solo si el número es PAR.\n- Columna 2: Toca solo si la figura es un TRIÁNGULO.\n- Columna 3: Toca solo si la esfera es ROJA.\n\nAciertos: +1 punto. Errores: -1 punto.\nDebes conseguir 20 puntos en 60 segundos.`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
          <Clock className="w-5 h-5 text-amber-400" />
          <span className={`font-bold font-display ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="text-white font-bold text-xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
          Puntaje: {score} / {targetScore}
        </div>
      </div>

      {/* 3 Columns Screen */}
      <div className="flex-1 flex pt-20">
        {/* COLUMN 1 */}
        <div className="flex-1 border-r-2 border-slate-800 flex flex-col items-center justify-between py-10 px-2 relative">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-center text-sm h-12">
            ¿Es PAR?
          </div>
          <div className="flex-1 flex items-center justify-center w-full relative">
            <AnimatePresence>
              {task1Item && (
                <motion.div
                  key={task1Item.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute w-24 h-24 bg-cyan-600 rounded-full flex items-center justify-center border-4 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                >
                  <span className="text-3xl font-black text-white">{task1Item.value}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => task1Item && handleAction(task1Item.value % 2 === 0, () => setTask1Item(null))} className="w-full max-w-[150px] py-4 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-600 rounded-xl text-white font-bold transition-all active:scale-95">
            ES PAR
          </button>
        </div>

        {/* COLUMN 2 */}
        <div className="flex-1 border-r-2 border-slate-800 flex flex-col items-center justify-between py-10 px-2 relative">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-center text-sm h-12">
            ¿Es TRIÁNGULO?
          </div>
          <div className="flex-1 flex items-center justify-center w-full relative">
            <AnimatePresence>
              {task2Item && (
                <motion.div key={task2Item.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute">
                  {task2Item.type === 'triangle' && (
                    <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]"></div>
                  )}
                  {task2Item.type === 'circle' && (
                    <div className="w-20 h-20 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
                  )}
                  {task2Item.type === 'square' && (
                    <div className="w-20 h-20 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)]"></div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => task2Item && handleAction(task2Item.type === 'triangle', () => setTask2Item(null))} className="w-full max-w-[150px] py-4 bg-slate-800 hover:bg-slate-700 active:bg-fuchsia-600 border border-slate-600 rounded-xl text-white font-bold transition-all active:scale-95">
            ES TRIÁNGULO
          </button>
        </div>

        {/* COLUMN 3 */}
        <div className="flex-1 flex flex-col items-center justify-between py-10 px-2 relative">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-center text-sm h-12">
            ¿Es ROJA?
          </div>
          <div className="flex-1 flex items-center justify-center w-full relative">
            <AnimatePresence>
              {task3Item && (
                <motion.div key={task3Item.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className={`absolute w-20 h-20 rounded-full ${task3Item.color === 'red' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : task3Item.color === 'blue' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]'}`}>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => task3Item && handleAction(task3Item.color === 'red', () => setTask3Item(null))} className="w-full max-w-[150px] py-4 bg-slate-800 hover:bg-slate-700 active:bg-red-600 border border-slate-600 rounded-xl text-white font-bold transition-all active:scale-95">
            ES ROJA
          </button>
        </div>
      </div>

      {/* Status overlays */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-red-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Tiempo Agotado!</h3>
              <p className="text-slate-300">Faltaron reflejos.</p>
              <button onClick={() => { setScore(0); setTimeLeft(60); setGameOver(false); setTask1Item(null); setTask2Item(null); setTask3Item(null); }} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold mt-4">
                Reintentar
              </button>
            </div>
          </motion.div>
        )}
        {win && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-emerald-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Mente Maestra Multitarea!</h3>
              <p className="text-slate-300">Has dominado la atención dividida en 3 focos.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
