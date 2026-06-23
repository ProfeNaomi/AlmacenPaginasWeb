import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface SimonSaysMathGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface OperationBtn {
  id: number;
  color: string;
  label: string;
  fn: (x: number) => number;
}

const OPERATIONS: OperationBtn[] = [
  { id: 0, color: 'bg-red-500', label: '+ 2', fn: x => x + 2 },
  { id: 1, color: 'bg-blue-500', label: '- 1', fn: x => x - 1 },
  { id: 2, color: 'bg-emerald-500', label: 'x 2', fn: x => x * 2 },
  { id: 3, color: 'bg-amber-500', label: '+ 5', fn: x => x + 5 },
];

export default function SimonSaysMathGame({ onWin, onClose }: SimonSaysMathGameProps) {
  const { playSound } = useAudio();
  const [sequence, setSequence] = useState<number[]>([]);
  const [playingSequence, setPlayingSequence] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [baseNumber, setBaseNumber] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetScore = 5;

  const startRound = () => {
    const newSeqLen = 2 + score; // sequence length increases
    const newSeq = Array.from({ length: newSeqLen }, () => Math.floor(Math.random() * 4));
    setSequence(newSeq);
    
    const base = Math.floor(Math.random() * 10) + 1;
    setBaseNumber(base);
    
    // Calculate correct answer
    let result = base;
    for (const opId of newSeq) {
      result = OPERATIONS[opId].fn(result);
    }

    // Generate options
    const opts = [result];
    while(opts.length < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = result + offset;
      if (wrong !== result && !opts.includes(wrong) && wrong > 0) {
        opts.push(wrong);
      }
    }
    setOptions(opts.sort(() => Math.random() - 0.5));
    
    // Play sequence
    setPlayingSequence(true);
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        setActiveButton(newSeq[step]);
        playSound('click');
        setTimeout(() => setActiveButton(null), 400);
        step++;
      } else {
        clearInterval(interval);
        setPlayingSequence(false);
      }
    }, 800);
  };

  useEffect(() => {
    if (score < targetScore && !gameOver && !win && !showInstructions) {
      setTimeout(startRound, 1000);
    }
  }, [score, gameOver, win]);

  const handleAnswer = (ans: number) => {
    if (playingSequence || gameOver || win || showInstructions || isProcessing) return;
    setIsProcessing(true);
    
    let result = baseNumber;
    for (const opId of sequence) {
      result = OPERATIONS[opId].fn(result);
    }

    if (ans === result) {
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
    }
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 items-center justify-center relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Simón Dice Matemático"
            instructions={`Observa el NÚMERO BASE.\n\nMemoriza la secuencia de operaciones (+2, -1, x2, +5) que se iluminen.\n\nAplica esas operaciones mentalmente al Número Base en orden, y elige el resultado final correcto.`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 absolute top-6">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <Heart key={i} className={`w-6 h-6 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800'} transition-all`} />
          ))}
        </div>
        <div className="text-cyan-400 font-bold text-xl">
          Nivel {score + 1}/{targetScore}
        </div>
      </div>

      <div className="text-center mb-12 mt-10">
        <h2 className="text-slate-400 font-bold uppercase tracking-widest mb-4">Número Base:</h2>
        <div className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
          {baseNumber}
        </div>
        <p className="text-slate-500 mt-4">
          {playingSequence ? 'Memoriza la secuencia de operaciones...' : 'Aplica la secuencia y elige el resultado'}
        </p>
      </div>

      {/* Simon Grid */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        {OPERATIONS.map((op) => {
          const isActive = activeButton === op.id;
          return (
            <div
              key={op.id}
              className={`w-32 h-32 rounded-3xl flex items-center justify-center text-4xl font-black text-white transition-all duration-300 ${op.color} ${isActive ? 'scale-110 brightness-150 shadow-[0_0_50px_currentColor]' : 'brightness-50 scale-100 opacity-50'}`}
            >
              {op.label}
            </div>
          )
        })}
      </div>

      {/* Options */}
      <div className={`flex gap-4 transition-opacity duration-500 ${playingSequence ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(opt)}
            className="w-24 h-24 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-2xl text-3xl font-bold text-white border border-slate-700 active:scale-95 transition-all shadow-lg"
          >
            {opt}
          </button>
        ))}
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Secuencia Olvidada!</h3>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); }}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold mt-4">
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Memoria Perfecta!</h3>
              <p className="text-slate-300">Has calculado toda la secuencia mentalmente.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
