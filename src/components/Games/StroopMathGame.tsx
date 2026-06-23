import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, Clock } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface StroopMathGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function StroopMathGame({ onWin, onClose }: StroopMathGameProps) {
  const { playSound } = useAudio();
  const [num1, setNum1] = useState({ value: 0, sizeClass: '' });
  const [num2, setNum2] = useState({ value: 0, sizeClass: '' });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetScore = 12;

  const generateRound = () => {
    const val1 = Math.floor(Math.random() * 99) + 1;
    let val2 = Math.floor(Math.random() * 99) + 1;
    while (val1 === val2) val2 = Math.floor(Math.random() * 99) + 1;

    const isVal1LargerMath = val1 > val2;
    
    // 70% of the time, the mathematically larger number will be physically smaller (Stroop interference)
    const useInterference = Math.random() < 0.7;
    
    if (useInterference) {
      if (isVal1LargerMath) {
        setNum1({ value: val1, sizeClass: 'text-3xl' });
        setNum2({ value: val2, sizeClass: 'text-9xl' });
      } else {
        setNum1({ value: val1, sizeClass: 'text-9xl' });
        setNum2({ value: val2, sizeClass: 'text-3xl' });
      }
    } else {
      // Congruent
      if (isVal1LargerMath) {
        setNum1({ value: val1, sizeClass: 'text-9xl' });
        setNum2({ value: val2, sizeClass: 'text-3xl' });
      } else {
        setNum1({ value: val1, sizeClass: 'text-3xl' });
        setNum2({ value: val2, sizeClass: 'text-9xl' });
      }
    }
  };

  useEffect(() => {
    if (!showInstructions) generateRound();
  }, [score]);

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
  }, [score, gameOver, win]);

  const handleSelection = (selectedVal: number, otherVal: number) => {
    if (gameOver || win || showInstructions || isProcessing) return;
    setIsProcessing(true);

    if (selectedVal > otherVal) {
      playSound('success');
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
      // Small penalty on time
      setTimeLeft(t => Math.max(0, t - 2));
    }
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 items-center justify-center relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Efecto Stroop"
            instructions={`Selecciona el número matemáticamente MAYOR.\n\nIgnora el tamaño físico del número en la pantalla, confía solo en el valor matemático.\n\nTienes 30 segundos y 3 vidas. ¡No te dejes engañar!`}
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className={`font-bold font-display ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="text-cyan-400 font-bold text-xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
            {score}/{targetScore}
          </div>
        </div>
      </div>

      <div className="text-center mb-16 mt-10">
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-widest">Selecciona el MAYOR</h2>
        <p className="text-red-400 font-bold">
          ¡Cuidado con la trampa visual! Fíjate en el VALOR matemático.
        </p>
      </div>

      {/* Interaction Area */}
      <div className="flex items-center justify-center gap-8 w-full max-w-2xl">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelection(num1.value, num2.value)}
          className="flex-1 h-64 bg-slate-800 rounded-3xl border-2 border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <span className={`font-black text-white ${num1.sizeClass}`}>
            {num1.value}
          </span>
        </motion.button>

        <div className="text-3xl font-black text-slate-600">VS</div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelection(num2.value, num1.value)}
          className="flex-1 h-64 bg-slate-800 rounded-3xl border-2 border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <span className={`font-black text-white ${num2.sizeClass}`}>
            {num2.value}
          </span>
        </motion.button>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Tu cerebro fue engañado!</h3>
              <p className="text-slate-300">El efecto Stroop venció tu lógica.</p>
              <button onClick={() => { setScore(0); setLives(3); setTimeLeft(30); setGameOver(false); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Lógica Inquebrantable!</h3>
              <p className="text-slate-300">Superaste la interferencia visual.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
