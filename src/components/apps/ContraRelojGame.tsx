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

  // Nivel 1 (Preguntas 1 a 3): Números 0 a 20
  addQuestion(0, 20, 1);
  addQuestion(0, 20, 2);
  addQuestion(0, 20, 3);
  // Nivel 2 (Preguntas 4 a 6): Números 10 a 40
  addQuestion(10, 40, 4);
  addQuestion(10, 40, 5);
  addQuestion(10, 40, 6);
  // Nivel 3 (Preguntas 7 a 9): Números 20 a 70
  addQuestion(20, 70, 7);
  addQuestion(20, 70, 8);
  addQuestion(20, 70, 9);
  // Nivel 4 (Pregunta 10): Números 50 a 100
  addQuestion(50, 100, 10);

  return qs;
};

export default function ContraRelojGame({ onWin, onClose }: ContraRelojProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(80);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [wrongOption, setWrongOption] = useState<number | null>(null);
  const [flash, setFlash] = useState<'none' | 'correct' | 'wrong'>('none');

  const startGame = useCallback(() => {
    setQuestions(generateQuestions());
    setCurrentIndex(0);
    setTimeLeft(80);
    setGameState('playing');
    setWrongOption(null);
    setFlash('none');
  }, []);

  const playSound = (type: 'correct' | 'wrong') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
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
      console.log("Audio not supported");
    }
  };

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
      setFlash('correct');
      playSound('correct');
      setTimeout(() => setFlash('none'), 300);

      if (currentIndex === questions.length - 1) {
        // Last question
        setGameState('won');
      } else {
        // Next question
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      // Wrong! Penalize by 2 seconds
      setWrongOption(option);
      setFlash('wrong');
      playSound('wrong');
      setTimeout(() => setFlash('none'), 300);

      setTimeLeft(prev => {
        const newTime = prev - 2;
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
      <div className="flex flex-col items-center justify-center h-full text-white p-6 relative z-10">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Clock className="w-24 h-24 text-cyan-400 mb-6" />
        <h1 className="text-5xl font-display font-bold mb-4 text-center">Contra Reloj</h1>
        <p className="text-xl text-slate-300 mb-8 max-w-md text-center">
          Resuelve 10 sumas mentalmente antes de que se acabe el tiempo (1m 20s). 
          Cada error te restará 2 segundos. ¡Prepárate!
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
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center z-10">
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(star => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: star * 0.2, type: 'spring' }}
                >
                  <svg className="w-16 h-16 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </motion.div>
              ))}
            </div>
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
      {/* Efecto de Flash en pantalla */}
      <AnimatePresence>
        {flash === 'correct' && (
          <motion.div 
            initial={{ opacity: 0.5 }} 
            animate={{ opacity: 0 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-green-500/30 z-0 pointer-events-none rounded-b-3xl"
          />
        )}
        {flash === 'wrong' && (
          <motion.div 
            initial={{ opacity: 0.5 }} 
            animate={{ opacity: 0 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-red-500/30 z-0 pointer-events-none rounded-b-3xl"
          />
        )}
      </AnimatePresence>

      {/* Cabecera */}
      <header className="flex justify-between items-center mb-8 relative z-10">
        <button onClick={onClose} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Volver</span>
        </button>
        
        <div className="flex flex-col items-center flex-1 mx-4 sm:mx-8 max-w-md">
          <div className="flex justify-between w-full mb-2 font-bold text-slate-300">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> Tiempo</span>
            <span className={timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}>{timeLeft}s</span>
          </div>
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <motion.div 
              className={`h-full ${timeLeft <= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 80) * 100}%` }}
              transition={{ ease: 'linear', duration: 1 }}
            />
          </div>
        </div>

        <button onClick={startGame} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors flex items-center gap-2">
          <RotateCcw className="w-5 h-5" /> <span className="hidden sm:inline">Reiniciar</span>
        </button>
      </header>

      <div className="w-full bg-slate-800 h-2 rounded-full mb-12 overflow-hidden relative z-10">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
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
