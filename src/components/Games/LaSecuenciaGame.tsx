import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface LaSecuenciaGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface SequenceQuestion {
  seq: (number | null)[];
  answer: number;
  options: number[];
}

const generateSequences = (): SequenceQuestion[] => {
  const qs: SequenceQuestion[] = [];
  for (let i = 0; i < 10; i++) {
    const step = Math.floor(Math.random() * 15) + 2;
    const start = Math.floor(Math.random() * 50) + 10;
    const isIncreasing = Math.random() > 0.3;
    
    const seqFull: number[] = [];
    for (let j = 0; j < 5; j++) {
      seqFull.push(isIncreasing ? start + j * step : start + (4 - j) * step);
    }
    
    const missingIdx = Math.floor(Math.random() * 5);
    const answer = seqFull[missingIdx];
    
    const seq: (number | null)[] = [...seqFull];
    seq[missingIdx] = null;
    
    const optionsSet = new Set<number>([answer]);
    while (optionsSet.size < 3) {
      const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const wrong = answer + offset * (Math.random() > 0.5 ? step : 1);
      if (wrong !== answer && wrong > 0) optionsSet.add(wrong);
    }
    
    qs.push({
      seq,
      answer,
      options: Array.from(optionsSet).sort(() => Math.random() - 0.5)
    });
  }
  return qs;
};

export default function LaSecuenciaGame({ onWin, onClose }: LaSecuenciaGameProps) {
  const { playCorrect, playIncorrect, playLevelComplete } = useAudio();
  const [gameQuestions, setGameQuestions] = useState<SequenceQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    if (gameQuestions.length === 0) {
      setGameQuestions(generateSequences());
    }
  }, [gameQuestions.length]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleSelect = (option: number) => {
    if (gameState !== 'playing' || feedback !== null) return;

    const q = gameQuestions[currentIdx];
    if (option === q.answer) {
      playCorrect();
      setFeedback('correct');
      setScore(s => s + 1);
    } else {
      playIncorrect();
      setFeedback('incorrect');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 >= gameQuestions.length) {
        // Terminó el set
        if (score + (option === q.answer ? 1 : 0) >= 7) { // 7/10 para ganar
          setGameState('won');
          playLevelComplete();
        } else {
          setGameState('lost');
        }
      } else {
        setCurrentIdx(prev => prev + 1);
      }
    }, 1000);
  };

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          {gameState === 'won' ? (
             <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-4" />
          ) : (
             <XCircle className="w-32 h-32 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-4xl font-bold mb-6">{gameState === 'won' ? '¡Nivel Superado!' : timeLeft === 0 ? '¡Tiempo Agotado!' : '¡Intenta de nuevo!'}</h2>
          <p className="text-xl text-slate-300 mb-8">Puntuación: {score} / {gameQuestions.length}</p>

          <div className="flex gap-4 justify-center">
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors">
              Volver al Mapa
            </button>
            {gameState === 'won' && onWin && (
              <button onClick={onWin} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-colors shadow-lg shadow-cyan-500/50">
                Continuar
              </button>
            )}
            {gameState === 'lost' && (
              <button onClick={() => { setGameState('playing'); setCurrentIdx(0); setScore(0); setTimeLeft(60); setGameQuestions(generateSequences()); }} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-colors">
                Reintentar
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const q = gameQuestions[currentIdx];
  if (!q) return null;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 sm:p-10 text-white font-sans">
      <div className="flex justify-between items-center mb-10 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg font-bold text-lg">
            <span className="text-slate-400">Secuencia</span> <span className="text-cyan-400">{currentIdx + 1}/{gameQuestions.length}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> {score}
          </div>
        </div>
        <div className={`flex items-center gap-2 text-2xl font-bold px-6 py-2 rounded-xl ${timeLeft <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-white'}`}>
          <Clock className="w-6 h-6" />
          {timeLeft}s
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-12 text-center text-indigo-100">
          Completa la Secuencia
        </h2>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {q.seq.map((num, i) => (
            <div key={i} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-4xl font-bold shadow-lg ${
              num === null ? 'border-dashed border-cyan-400 bg-cyan-900/20 text-cyan-400' : 'bg-slate-800 border-slate-700 text-white'
            }`}>
              {num === null ? '?' : num}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6">
          {q.options.map((opt, i) => {
            let bgColor = 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:bg-indigo-900/40 text-white';
            if (feedback !== null) {
               if (opt === q.answer) bgColor = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
               else bgColor = 'bg-slate-800/50 border-slate-800 text-slate-500 opacity-50';
            }
            return (
              <motion.button
                key={i}
                whileHover={{ scale: feedback ? 1 : 1.05 }}
                whileTap={{ scale: feedback ? 1 : 0.95 }}
                onClick={() => handleSelect(opt)}
                disabled={feedback !== null}
                className={`w-24 h-16 sm:w-32 sm:h-20 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold shadow-lg transition-colors ${bgColor}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        <div className="h-20 mt-10 flex items-center justify-center">
          {feedback === 'correct' && (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-emerald-400 flex items-center gap-2 text-2xl font-bold">
               <CheckCircle2 className="w-8 h-8" /> ¡Correcto!
             </motion.div>
          )}
          {feedback === 'incorrect' && (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-red-400 flex items-center gap-2 text-2xl font-bold">
               <XCircle className="w-8 h-8" /> ¡Error!
             </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
