import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface SymmetricalReflexGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function SymmetricalReflexGame({ onWin, onClose }: SymmetricalReflexGameProps) {
  const { playSound } = useAudio();
  const [targetGrid, setTargetGrid] = useState<boolean[]>([]);
  const [playerGrid, setPlayerGrid] = useState<boolean[]>(Array(16).fill(false));
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const gridSize = 4; // 4x4
  const targetScore = 5;

  const generatePattern = () => {
    const newTarget = Array(16).fill(false);
    // Randomly fill 4-6 blocks
    const numBlocks = Math.floor(Math.random() * 3) + 4;
    let placed = 0;
    while (placed < numBlocks) {
      const idx = Math.floor(Math.random() * 16);
      if (!newTarget[idx]) {
        newTarget[idx] = true;
        placed++;
      }
    }
    setTargetGrid(newTarget);
    setPlayerGrid(Array(16).fill(false));
  };

  useEffect(() => {
    if (!showInstructions) generatePattern();
  }, [score, showInstructions]);

  // Check if player grid is the exact mirror of target grid
  const checkMirror = (currentGrid: boolean[]) => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const targetIdx = r * gridSize + c;
        const mirroredCol = (gridSize - 1) - c;
        const playerIdx = r * gridSize + mirroredCol;
        
        if (targetGrid[targetIdx] !== currentGrid[playerIdx]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (idx: number) => {
    if (gameOver || win || showInstructions || isProcessing) return;
    setIsProcessing(true);
    playSound('click');
    
    const newPlayerGrid = [...playerGrid];
    newPlayerGrid[idx] = !newPlayerGrid[idx];
    setPlayerGrid(newPlayerGrid);

    // If the number of active blocks matches the target, check for win
    const targetActiveCount = targetGrid.filter(Boolean).length;
    const playerActiveCount = newPlayerGrid.filter(Boolean).length;

    if (playerActiveCount === targetActiveCount) {
      if (checkMirror(newPlayerGrid)) {
        // Correct reflection
        playSound('success');
        setTimeout(() => {
           setScore(s => {
             if (s + 1 >= targetScore) {
               setWin(true);
               setTimeout(() => onWin?.(), 2000);
             }
             return s + 1;
           });
        }, 500);
      } else {
        // Incorrect reflection but used all blocks
        playSound('error');
        setLives(l => {
          if (l - 1 <= 0) setGameOver(true);
          return l - 1;
        });
        // Reset player grid for this round to try again
        setPlayerGrid(Array(16).fill(false));
      }
    }
    setTimeout(() => setIsProcessing(false), 50);
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 items-center justify-center relative overflow-hidden">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Reflejo Simétrico"
            instructions={`Dibuja en la cuadrícula de la derecha el REFLEJO EXACTO del patrón de la izquierda, como si hubiera un espejo en el medio.\n\n¡Rápido, usa tu percepción espacial!`}
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

      <div className="text-center mb-10 mt-12">
        <h2 className="text-4xl font-black text-white uppercase tracking-widest">Reflejo Simétrico</h2>
        <p className="text-slate-400 mt-2">
          Dibuja en la derecha el reflejo (espejo) del patrón de la izquierda.
        </p>
      </div>

      {/* Game Area */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-12 w-full max-w-4xl justify-center relative">
        
        {/* Center Mirror Line */}
        <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-500 to-transparent -translate-x-1/2 opacity-50 z-0"></div>

        {/* Target Grid (Left) */}
        <div className="grid grid-cols-4 gap-2 bg-slate-900/50 p-4 rounded-3xl border border-slate-800 backdrop-blur-md z-10">
          {targetGrid.map((isActive, idx) => (
            <div
              key={`target-${idx}`}
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl transition-all duration-300 ${isActive ? 'bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'bg-slate-800/50'}`}
            ></div>
          ))}
        </div>

        {/* Horizontal Mirror Line for mobile */}
        <div className="sm:hidden w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

        {/* Player Grid (Right) */}
        <div className="grid grid-cols-4 gap-2 bg-slate-900/50 p-4 rounded-3xl border border-slate-800 backdrop-blur-md z-10">
          {playerGrid.map((isActive, idx) => (
            <motion.button
              key={`player-${idx}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCellClick(idx)}
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl transition-all duration-150 ${isActive ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-800 hover:bg-slate-700'}`}
            ></motion.button>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Rotura de Simetría!</h3>
              <p className="text-slate-300">La percepción espacial falló esta vez.</p>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); generatePattern(); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Espejo Perfecto!</h3>
              <p className="text-slate-300">Tienes una visión espacial excelente.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
