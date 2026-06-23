import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, Lock } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface SafeCrackersGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface CoinDrop {
  id: string;
  safeIndex: number;
  value: number;
}

export default function SafeCrackersGame({ onWin, onClose }: SafeCrackersGameProps) {
  const { playSound } = useAudio();
  const [safeTotals, setSafeTotals] = useState<number[]>([0, 0, 0]);
  const [currentDrop, setCurrentDrop] = useState<CoinDrop | null>(null);
  const [isQuestionTime, setIsQuestionTime] = useState(false);
  const [questionSafe, setQuestionSafe] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const targetScore = 5;

  const generateOptions = (correctTotal: number) => {
    const opts = [correctTotal];
    while(opts.length < 3) {
      const offset = Math.floor(Math.random() * 6) - 3;
      const wrong = correctTotal + offset;
      if (wrong !== correctTotal && !opts.includes(wrong) && wrong >= 0) {
        opts.push(wrong);
      }
    }
    return opts.sort(() => Math.random() - 0.5);
  };

  const startRound = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSafeTotals([0, 0, 0]);
    setIsQuestionTime(false);
    setCurrentDrop(null);
    
    // Sequence of 4-6 drops
    const numDrops = Math.floor(Math.random() * 3) + 4 + Math.floor(score / 2);
    const drops: CoinDrop[] = [];
    const totals = [0, 0, 0];

    for (let i = 0; i < numDrops; i++) {
      const sIdx = Math.floor(Math.random() * 3);
      const val = Math.floor(Math.random() * 4) + 1; // +1 to +4
      totals[sIdx] += val;
      drops.push({ id: Math.random().toString(), safeIndex: sIdx, value: val });
    }

    // Play sequence
    let step = 0;
    intervalRef.current = setInterval(() => {
      if (step < drops.length) {
        setCurrentDrop(drops[step]);
        playSound('click');
        
        setTimeout(() => setCurrentDrop(null), 800);
        step++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSafeTotals(totals);
        // Pick a random safe to ask about
        const qSafe = Math.floor(Math.random() * 3);
        setQuestionSafe(qSafe);
        setOptions(generateOptions(totals[qSafe]));
        setTimeout(() => setIsQuestionTime(true), 1000);
      }
    }, 1500);
  };

  useEffect(() => {
    if (score < targetScore && !gameOver && !win && !showInstructions) {
      setTimeout(startRound, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [score, gameOver, win, showInstructions]);

  const handleAnswer = (ans: number) => {
    if (gameOver || win || isProcessing || showInstructions) return;
    setIsProcessing(true);
    
    if (ans === safeTotals[questionSafe]) {
      playSound('success');
      setIsQuestionTime(false);
      setScore(s => {
        if (s + 1 >= targetScore) {
          setWin(true);
          setTimeout(() => onWin?.(), 2000);
        }
        setIsProcessing(false);
        return s + 1;
      });
    } else {
      playSound('error');
      setLives(l => {
        if (l - 1 <= 0) setGameOver(true);
        return l - 1;
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 items-center justify-center relative overflow-hidden">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Cajas Fuertes"
            instructions={`Observa atentamente las tres cajas fuertes.\n\nVerás monedas caer en diferentes cajas. ¡Lleva la cuenta mental de la suma total en CADA caja!\n\nAl final, te preguntaremos por el total de una caja al azar.`}
            onStart={() => setShowInstructions(false)}
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
        <div className="text-cyan-400 font-bold text-xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
          Nivel {score + 1}/{targetScore}
        </div>
      </div>

      <div className="text-center mb-16 mt-10">
        <h2 className="text-4xl font-black text-white uppercase tracking-widest">Cajas Fuertes</h2>
        <p className="text-slate-400 mt-2">
          Lleva la cuenta mental de cuánto dinero cae en cada caja.
        </p>
      </div>

      {/* Safes Area */}
      <div className="flex gap-4 sm:gap-12 mb-16 relative">
        {[0, 1, 2].map(idx => (
          <div key={idx} className="flex flex-col items-center relative">
            <div className="text-slate-500 font-bold mb-4 uppercase tracking-widest">Caja {idx + 1}</div>
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 flex items-center justify-center transition-all ${isQuestionTime && questionSafe === idx ? 'border-cyan-400 bg-cyan-900/50 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : 'border-slate-700 bg-slate-800'}`}>
              <Lock className={`w-10 h-10 ${isQuestionTime && questionSafe === idx ? 'text-cyan-400' : 'text-slate-600'}`} />
            </div>

            {/* Coin Drop Animation */}
            <AnimatePresence>
              {currentDrop && currentDrop.safeIndex === idx && (
                <motion.div
                  initial={{ y: -150, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-0 w-16 h-16 sm:w-20 sm:h-20 bg-amber-400 rounded-full border-4 border-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.8)] z-20"
                >
                  <span className="text-amber-900 font-black text-2xl">+{currentDrop.value}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Question / Options Area */}
      <div className={`h-40 transition-all duration-500 ${isQuestionTime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          ¿Cuánto hay en la <span className="text-cyan-400">Caja {questionSafe + 1}</span>?
        </h3>
        <div className="flex gap-4 justify-center">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              className="w-20 h-20 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-2xl border border-slate-600 text-white font-bold text-3xl shadow-lg transition-all active:scale-95"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Status overlays */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
          >
            <div className="bg-slate-900 border border-red-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Caja bloqueada!</h3>
              <p className="text-slate-300">Perdiste la cuenta de los depósitos.</p>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Cajero Experto!</h3>
              <p className="text-slate-300">Tienes una memoria de trabajo impecable.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
