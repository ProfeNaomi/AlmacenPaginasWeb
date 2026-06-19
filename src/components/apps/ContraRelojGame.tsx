import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface ContraRelojProps {
  onWin: () => void;
  onClose: () => void;
}

interface Question {
  id: number;
  a: number;
  b: number;
  correctAnswer: number;
  options: number[];
}

const generateQuestions = (): Question[] => {
  const qs: Question[] = [];
  const usedPairs = new Set<string>();

  const getDistinctOptions = (correct: number): number[] => {
    const opts = new Set<number>([correct]);
    while (opts.size < 4) {
      // Distractors are usually off by 1, 10, or a small random number
      const variations = [
        correct + 1, correct - 1, 
        correct + 10, correct - 10,
        correct + 2, correct - 2,
        correct + Math.floor(Math.random() * 5) + 1,
        correct - Math.floor(Math.random() * 5) - 1
      ];
      const randomVar = variations[Math.floor(Math.random() * variations.length)];
      if (randomVar > 0) {
        opts.add(randomVar);
      }
    }
    return Array.from(opts).sort(() => Math.random() - 0.5); // Shuffle
  };

  const addQuestion = (min: number, max: number, id: number) => {
    let a = 0, b = 0;
    let found = false;
    while (!found) {
      a = Math.floor(Math.random() * (max - min + 1)) + min;
      b = Math.floor(Math.random() * (max - min + 1)) + min;
      const key = `${Math.min(a,b)}-${Math.max(a,b)}`;
      if (!usedPairs.has(key)) {
        usedPairs.add(key);
        found = true;
      }
    }
    
    const correct = a + b;
    qs.push({
      id,
      a,
      b,
      correctAnswer: correct,
      options: getDistinctOptions(correct)
    });
  };

  // Nivel 1 (Preguntas 1 a 3): Números 1 a 20
  addQuestion(1, 20, 1);
  addQuestion(1, 20, 2);
  addQuestion(1, 20, 3);
  // Nivel 2 (Preguntas 4 a 6): Números 10 a 50
  addQuestion(10, 50, 4);
  addQuestion(10, 50, 5);
  addQuestion(10, 50, 6);
  // Nivel 3 (Preguntas 7 a 9): Números 25 a 100
  addQuestion(25, 100, 7);
  addQuestion(25, 100, 8);
  addQuestion(25, 100, 9);
  // Nivel 4 (Pregunta 10): Números 50 a 200
  addQuestion(50, 200, 10);

  return qs;
};

export default function ContraRelojGame({ onWin, onClose }: ContraRelojProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [wrongOption, setWrongOption] = useState<number | null>(null);

  const startGame = useCallback(() => {
    setQuestions(generateQuestions());
    setCurrentIndex(0);
    setTimeLeft(60);
    setGameState('playing');
    setWrongOption(null);
  }, []);

  // Timer logic
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
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleOptionClick = (option: number) => {
    if (gameState !== 'playing') return;

    const currentQ = questions[currentIndex];
    if (option === currentQ.correctAnswer) {
      // Correct!
      setWrongOption(null);
      if (currentIndex === questions.length - 1) {
        // Last question
        setGameState('won');
      } else {
        // Next question
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      // Wrong! Penalize by 5 seconds
      setWrongOption(option);
      setTimeLeft(prev => {
        const newTime = prev - 5;
        if (newTime <= 0) {
          setGameState('lost');
          return 0;
        }
        return newTime;
      });
      setTimeout(() => setWrongOption(null), 500); // clear wrong state after animation
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-6 relative">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Clock className="w-24 h-24 text-cyan-400 mb-6" />
        <h1 className="text-5xl font-display font-bold mb-4 text-center">Contra Reloj</h1>
        <p className="text-xl text-slate-300 mb-8 max-w-md text-center">
          Resuelve 10 sumas mentalmente antes de que se acabe el minuto (60s). 
          Cada error te restará 5 segundos. ¡Prepárate!
        </p>
        <button 
          onClick={startGame}
          className="bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-900 font-bold text-2xl px-12 py-4 rounded-full shadow-[0_0_30px_rgba(52,211,153,0.3)] transition-all transform hover:scale-105"
        >
          Empezar
        </button>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-6 relative">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        {gameState === 'won' ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
            <CheckCircle className="w-24 h-24 text-emerald-400 mb-6" />
            <h2 className="text-5xl font-bold mb-4 text-emerald-400">¡Reto Completado!</h2>
            <p className="text-xl mb-8">Sobró tiempo: <span className="font-bold text-cyan-400">{timeLeft}s</span></p>
            <div className="flex gap-4">
              <button onClick={onWin} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-8 py-3 rounded-full transition-colors">
                Continuar al Mapa
              </button>
              <button onClick={startGame} className="bg-slate-700 hover:bg-slate-600 font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2">
                <RotateCcw className="w-5 h-5" /> Reintentar
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
            <XCircle className="w-24 h-24 text-rose-500 mb-6" />
            <h2 className="text-5xl font-bold mb-4 text-rose-500">¡Tiempo Agotado!</h2>
            <p className="text-xl mb-8 text-slate-300">Llegaste hasta la pregunta {currentIndex + 1} de 10.</p>
            <div className="flex gap-4">
              <button onClick={startGame} className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2">
                <RotateCcw className="w-5 h-5" /> Intentarlo de nuevo
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col h-full text-white p-6 max-w-4xl mx-auto w-full relative">
      {/* Cabecera */}
      <header className="flex justify-between items-center mb-12 relative z-10">
        <button onClick={onClose} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Volver</span>
        </button>
        
        <div className={`flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-full border-2 ${timeLeft <= 10 ? 'border-rose-500 text-rose-400 animate-pulse' : 'border-slate-700'}`}>
          <Clock className="w-6 h-6" />
          <span className="text-2xl font-bold font-mono">{timeLeft}s</span>
        </div>

        <button onClick={startGame} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors flex items-center gap-2">
          <RotateCcw className="w-5 h-5" /> <span className="hidden sm:inline">Reiniciar</span>
        </button>
      </header>

      {/* Progreso */}
      <div className="w-full bg-slate-800 h-2 rounded-full mb-12 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQ.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="flex flex-col items-center w-full max-w-2xl"
          >
            <div className="text-slate-400 mb-2 font-bold tracking-widest uppercase">Pregunta {currentIndex + 1} de 10</div>
            
            {/* Ecuación */}
            <div className="text-7xl sm:text-8xl md:text-9xl font-display font-bold text-white mb-16 flex items-center gap-4 sm:gap-8 tracking-tighter">
              <span>{currentQ.a}</span>
              <span className="text-cyan-400">+</span>
              <span>{currentQ.b}</span>
              <span className="text-cyan-400">=</span>
              <span className="text-slate-500">?</span>
            </div>

            {/* Opciones 2x2 */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
              {currentQ.options.map((opt, idx) => {
                const isWrong = wrongOption === opt;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={() => handleOptionClick(opt)}
                    className={`
                      text-3xl sm:text-4xl md:text-5xl font-bold py-6 sm:py-8 rounded-3xl border-4 transition-all
                      ${isWrong 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-500' 
                        : 'bg-slate-800 border-slate-700 hover:border-cyan-500 hover:bg-slate-700 text-white shadow-lg'}
                    `}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
