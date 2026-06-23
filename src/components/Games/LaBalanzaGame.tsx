import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Scale, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface LaBalanzaGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface EquationQuestion {
  left: string;
  right: string;
  answer: number;
  options: number[];
}

const generateEquations = (): EquationQuestion[] => {
  const qs: EquationQuestion[] = [];
  const operators = ['+', '-', '×'];
  const generatedLefts = new Set<string>();

  while (qs.length < 10) {
    const opLeft = operators[Math.floor(Math.random() * operators.length)];
    const opRight = operators[Math.floor(Math.random() * operators.length)];
    
    let leftValue = 0;
    let leftStr = "";
    if (opLeft === '+') {
      const a = Math.floor(Math.random() * 20) + 2;
      const b = Math.floor(Math.random() * 20) + 2;
      leftValue = a + b;
      leftStr = `${a} + ${b}`;
    } else if (opLeft === '-') {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * (a - 2)) + 2;
      leftValue = a - b;
      leftStr = `${a} - ${b}`;
    } else {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      leftValue = a * b;
      leftStr = `${a} × ${b}`;
    }

    if (generatedLefts.has(leftStr)) continue;
    
    let answer = 0;
    let rightStr = "";
    if (opRight === '+') {
      const known = Math.floor(Math.random() * (leftValue - 1)) + 1;
      if (known >= leftValue || known === 0) continue;
      answer = leftValue - known;
      rightStr = Math.random() > 0.5 ? `${known} + ?` : `? + ${known}`;
    } else if (opRight === '-') {
      answer = Math.floor(Math.random() * 10) + 2;
      const known = leftValue + answer;
      rightStr = `${known} - ?`;
    } else {
      const factors = [];
      for (let f = 2; f < leftValue; f++) {
        if (leftValue % f === 0) factors.push(f);
      }
      if (factors.length === 0) continue;
      const known = factors[Math.floor(Math.random() * factors.length)];
      answer = leftValue / known;
      rightStr = Math.random() > 0.5 ? `${known} × ?` : `? × ${known}`;
    }

    generatedLefts.add(leftStr);
    
    const optionsSet = new Set<number>([answer]);
    while(optionsSet.size < 3) {
      const wrong = answer + (Math.floor(Math.random() * 10) - 5);
      if (wrong !== answer && wrong >= 0) optionsSet.add(wrong);
    }
    
    qs.push({
      left: leftStr,
      right: rightStr,
      answer,
      options: Array.from(optionsSet).sort(() => Math.random() - 0.5)
    });
  }
  return qs;
};

export default function LaBalanzaGame({ onWin, onClose }: LaBalanzaGameProps) {
  const { playCorrect, playIncorrect, playLevelComplete } = useAudio();
  const [gameQuestions, setGameQuestions] = useState<EquationQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [balance, setBalance] = useState<'left' | 'right' | 'equal'>('equal');

  useEffect(() => {
    if (gameQuestions.length === 0) {
      setGameQuestions(generateEquations());
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
      setBalance('equal');
      setScore(s => s + 1);
    } else {
      playIncorrect();
      setFeedback('incorrect');
      setBalance(Math.random() > 0.5 ? 'left' : 'right'); // Animar hacia un lado aleatorio
    }

    setTimeout(() => {
      setFeedback(null);
      setBalance('equal');
      if (currentIdx + 1 >= gameQuestions.length) {
        if (score + (option === q.answer ? 1 : 0) >= 7) { // 7/10 para ganar
          setGameState('won');
          playLevelComplete();
        } else {
          setGameState('lost');
        }
      } else {
        setCurrentIdx(prev => prev + 1);
      }
    }, 1500);
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
          <h2 className="text-4xl font-bold mb-6">{gameState === 'won' ? '¡Nivel Superado!' : timeLeft === 0 ? '¡Tiempo Agotado!' : '¡Equilibrio Roto!'}</h2>
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
              <button onClick={() => { setGameState('playing'); setCurrentIdx(0); setScore(0); setTimeLeft(60); setGameQuestions(generateEquations()); }} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-colors">
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
            <span className="text-slate-400">Ecuación</span> <span className="text-cyan-400">{currentIdx + 1}/{gameQuestions.length}</span>
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
          Equilibra la Balanza
        </h2>

        <div className="flex flex-col items-center mb-16 relative w-full max-w-2xl">
          <motion.div 
            animate={{ rotate: balance === 'equal' ? 0 : balance === 'left' ? -15 : 15 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="w-full h-4 bg-slate-600 rounded-full flex justify-between items-center px-8 sm:px-16 relative origin-center"
          >
            {/* Base (Pivot) */}
            <div className="absolute left-1/2 -bottom-16 w-8 h-16 -translate-x-1/2">
              <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[64px] border-b-slate-500"></div>
            </div>

            {/* Platillo Izquierdo */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-slate-800/80 border-4 border-slate-700 rounded-b-[40px] flex items-center justify-center text-3xl font-bold translate-y-12 shadow-xl">
              <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-slate-500 -translate-x-1/2"></div>
              {q.left}
            </div>

            {/* Platillo Derecho */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-slate-800/80 border-4 border-slate-700 rounded-b-[40px] flex items-center justify-center text-3xl font-bold translate-y-12 shadow-xl">
              <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-slate-500 -translate-x-1/2"></div>
              {q.right}
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center gap-6 mt-20">
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
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold shadow-lg transition-colors ${bgColor}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        <div className="h-12 mt-8 flex items-center justify-center">
          {feedback === 'correct' && (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-emerald-400 flex items-center gap-2 text-2xl font-bold">
               <CheckCircle2 className="w-8 h-8" /> ¡Equilibrado!
             </motion.div>
          )}
          {feedback === 'incorrect' && (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-red-400 flex items-center gap-2 text-2xl font-bold">
               <XCircle className="w-8 h-8" /> ¡Desequilibrio!
             </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
