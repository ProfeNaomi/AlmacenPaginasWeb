import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Trophy, Clock, XCircle, CheckCircle2 } from 'lucide-react';

interface ElIntrusoGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface Question {
  title: string;
  options: number[];
  answer: number;
}

const generateIntrusoQuestions = (): Question[] => {
  const qs: Question[] = [];
  for (let i = 0; i < 10; i++) {
    const base = Math.floor(Math.random() * 8) + 2; // Base de 2 a 9
    const multiples = new Set<number>();
    while (multiples.size < 4) {
      multiples.add(base * (Math.floor(Math.random() * 10) + 2));
    }
    
    // Un número que no sea múltiplo
    const nonMultiple = base * (Math.floor(Math.random() * 10) + 2) + (Math.floor(Math.random() * (base - 1)) + 1);
    
    const options = [...Array.from(multiples), nonMultiple].sort(() => Math.random() - 0.5);
    qs.push({
      title: `¿Cuál NO es múltiplo de ${base}?`,
      options,
      answer: nonMultiple
    });
  }
  return qs;
};

export default function ElIntrusoGame({ onWin, onClose }: ElIntrusoGameProps) {
  const { playCorrect, playIncorrect, playLevelComplete } = useAudio();
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    if (gameQuestions.length === 0) {
      setGameQuestions(generateIntrusoQuestions());
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
    const stars = score >= 9 ? 3 : score >= 7 ? 2 : 1;
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          {gameState === 'won' ? (
             <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-4" />
          ) : (
             <XCircle className="w-32 h-32 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-4xl font-bold mb-2">{gameState === 'won' ? '¡Nivel Superado!' : '¡Tiempo Agotado!'}</h2>
          <p className="text-xl text-slate-300 mb-6">Puntuación: {score} / 10</p>
          
          {gameState === 'won' && (
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map(s => (
                <StarIcon key={s} active={s <= stars} />
              ))}
            </div>
          )}

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
              <button onClick={() => { setGameState('playing'); setCurrentIdx(0); setScore(0); setTimeLeft(60); }} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-colors">
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
    <div className="flex flex-col h-full bg-slate-950 p-6 sm:p-10 text-white font-sans relative overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 absolute top-0 left-0">
        <motion.div 
          className="h-full bg-cyan-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-10 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg font-bold text-lg">
            <span className="text-slate-400">Pregunta</span> <span className="text-cyan-400">{currentIdx + 1}/10</span>
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

      {/* Tablero Principal */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-indigo-100">
          {q.title}
        </h2>

        <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
          {q.options.map((opt, i) => {
            let bgColor = 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:bg-indigo-900/40 text-white';
            if (feedback !== null) {
               if (opt === q.answer) {
                 bgColor = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
               } else {
                 bgColor = 'bg-slate-800/50 border-slate-800 text-slate-500 opacity-50';
               }
            }

            return (
              <motion.button
                key={i}
                whileHover={{ scale: feedback ? 1 : 1.05 }}
                whileTap={{ scale: feedback ? 1 : 0.95 }}
                onClick={() => handleSelect(opt)}
                disabled={feedback !== null}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 flex items-center justify-center text-4xl font-bold shadow-lg transition-colors ${bgColor}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback visual */}
        <div className="h-20 mt-10 flex items-center justify-center">
          {feedback === 'correct' && (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-emerald-400 flex items-center gap-2 text-2xl font-bold">
               <CheckCircle2 className="w-8 h-8" /> ¡Correcto!
             </motion.div>
          )}
          {feedback === 'incorrect' && (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-red-400 flex items-center gap-2 text-2xl font-bold">
               <XCircle className="w-8 h-8" /> ¡Te equivocaste!
             </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-12 h-12 ${active ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 fill-slate-800'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}
