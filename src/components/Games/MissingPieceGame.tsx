import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, Puzzle } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface MissingPieceGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function MissingPieceGame({ onWin, onClose }: MissingPieceGameProps) {
  const { playSound } = useAudio();
  const [equation, setEquation] = useState({ left: '', right: '', answer: '', type: 'number' });
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetScore = 10;

  const generateRound = () => {
    const type = Math.random() > 0.5 ? 'number' : 'operator';
    let ans = '';
    let left = '';
    let right = '';
    let opts: string[] = [];

    if (type === 'number') {
      const op = Math.random() > 0.5 ? '+' : '-';
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      
      if (op === '+') {
        // a + ? = c
        const c = a + b;
        left = `${a} + `;
        right = ` = ${c}`;
        ans = b.toString();
        opts = [ans];
        while (opts.length < 4) {
          const wrong = (b + Math.floor(Math.random() * 10) - 5).toString();
          if (wrong !== ans && !opts.includes(wrong) && parseInt(wrong) > 0) opts.push(wrong);
        }
      } else {
        // a - ? = c
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        const c = max - min;
        left = `${max} - `;
        right = ` = ${c}`;
        ans = min.toString();
        opts = [ans];
        while (opts.length < 4) {
          const wrong = (min + Math.floor(Math.random() * 10) - 5).toString();
          if (wrong !== ans && !opts.includes(wrong) && parseInt(wrong) > 0) opts.push(wrong);
        }
      }
    } else {
      // operator
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const opChoices = ['+', '-', 'x'];
      const op = opChoices[Math.floor(Math.random() * opChoices.length)];
      let c = 0;
      if (op === '+') c = a + b;
      if (op === '-') { c = Math.max(a, b) - Math.min(a, b); left = `${Math.max(a, b)} `; right = ` ${Math.min(a, b)} = ${c}`; }
      else { left = `${a} `; right = ` ${b} = ${c}`; }
      
      if (op === 'x') { c = a * b; left = `${a} `; right = ` ${b} = ${c}`; }

      ans = op;
      opts = ['+', '-', 'x', '/'];
    }

    setEquation({ left, right, answer: ans, type });
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (score < targetScore && !gameOver && !win && !showInstructions) {
      generateRound();
    }
  }, [score, gameOver, win]);

  const handleSelection = (opt: string) => {
    if (gameOver || win || showInstructions || isProcessing) return;
    setIsProcessing(true);

    if (opt === equation.answer) {
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
            title="La Pieza Faltante"
            instructions={`Observa la ecuación incompleta en pantalla.\n\nSelecciona el número o el signo matemático que falta para que la igualdad sea correcta.\n\n¡Sé rápido y no te equivoques!`}
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
          Nivel {score}/{targetScore}
        </div>
      </div>

      <div className="text-center mb-16 mt-10">
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-widest flex items-center justify-center gap-3">
          <Puzzle className="w-10 h-10 text-fuchsia-400" />
          La Pieza Faltante
        </h2>
        <p className="text-slate-400">
          Encuentra el número u operador que completa la ecuación.
        </p>
      </div>

      {/* Equation Area */}
      <div className="flex flex-wrap items-center justify-center text-5xl sm:text-7xl font-black text-white mb-16">
        <span>{equation.left}</span>
        <div className="mx-4 w-20 h-24 sm:w-24 sm:h-28 bg-slate-800 border-4 border-dashed border-slate-600 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
          ?
        </div>
        <span>{equation.right}</span>
      </div>

      {/* Options Area */}
      <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-6">
        {options.map((opt, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelection(opt)}
            className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-600 hover:bg-indigo-500 active:bg-cyan-500 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-[0_10px_0_rgba(67,56,202,1)] active:shadow-[0_0px_0_rgba(67,56,202,1)] active:translate-y-2 transition-all"
          >
            {opt}
          </motion.button>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Ecuación Rota!</h3>
              <p className="text-slate-300">Esa pieza no encajaba.</p>
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Rompecabezas Resuelto!</h3>
              <p className="text-slate-300">Tienes un gran instinto algebraico.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
