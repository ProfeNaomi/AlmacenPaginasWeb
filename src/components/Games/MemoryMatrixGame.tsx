import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Star, X } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface MemoryMatrixGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function MemoryMatrixGame({ onWin, onClose }: MemoryMatrixGameProps) {
  const { playSound } = useAudio();
  const [gridSize, setGridSize] = useState(4);
  const [targetSequence, setTargetSequence] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sequenceLength = 4 + Math.floor(score / 2); // Increases difficulty

  const generateSequence = () => {
    const newSeq = Array(gridSize * gridSize).fill(0);
    let numbersPlaced = 0;
    while (numbersPlaced < sequenceLength) {
      const randIdx = Math.floor(Math.random() * (gridSize * gridSize));
      if (newSeq[randIdx] === 0) {
        newSeq[randIdx] = numbersPlaced + 1;
        numbersPlaced++;
      }
    }
    setTargetSequence(newSeq);
    setCurrentStep(1);
    setShowNumbers(true);
  };

  useEffect(() => {
    if (!showInstructions) generateSequence();
  }, [score, showInstructions]);

  useEffect(() => {
    if (showNumbers && !gameOver && !win) {
      const timer = setTimeout(() => {
        setShowNumbers(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showNumbers, targetSequence, gameOver, win]);

  const handleCellClick = (index: number) => {
    if (showNumbers || gameOver || win || isProcessing || showInstructions) return;
    setIsProcessing(true);

    const cellValue = targetSequence[index];

    if (cellValue === currentStep) {
      playSound('click');
      if (currentStep === sequenceLength) {
        // Completed this round
        playSound('success');
        if (score >= 4) {
          setWin(true);
          setTimeout(() => onWin?.(), 2000);
        } else {
          setScore(s => s + 1);
        }
      } else {
        setCurrentStep(s => s + 1);
      }
    } else if (cellValue !== 0 && cellValue > currentStep) {
      // Clicked wrong order
      playSound('error');
      setLives(l => l - 1);
      if (lives <= 1) {
        setGameOver(true);
      }
    } else {
      // Clicked empty cell
      playSound('error');
      setLives(l => l - 1);
      if (lives <= 1) {
        setGameOver(true);
      }
    }
    
    // Remove processing lock after a tiny delay to prevent double clicks
    setTimeout(() => setIsProcessing(false), 50);
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col items-center justify-center bg-slate-950 p-6 relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Batería de Memoria"
            instructions={`Memoriza las posiciones de los números que aparecen en la matriz.\n\nCuando desaparezcan, tócalos en orden secuencial (1, 2, 3...).\n\n¡Si te equivocas, perderás una vida!`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <Star key={i} className={`w-6 h-6 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-700'} transition-all`} />
          ))}
        </div>
        <div className="text-cyan-400 font-bold text-xl font-display">
          Nivel {score + 1}/5
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Matriz de Memoria</h2>
        <p className={`text-xl font-bold transition-colors ${showNumbers ? 'text-yellow-400 animate-pulse' : 'text-emerald-400'}`}>
          {showNumbers ? '¡MEMORIZA LOS NÚMEROS! ⏳' : '¡TOCA LAS CELDAS! (1, 2, 3...) ✅'}
        </p>
      </div>

      {/* Grid */}
      <div 
        className="grid gap-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {targetSequence.map((val, idx) => {
          const isRevealed = val !== 0 && (showNumbers || val < currentStep);
          const isWrong = val === 0 || (val > currentStep && lives <= 0);
          
          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCellClick(idx)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${isRevealed ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 text-transparent border border-slate-700 hover:border-cyan-500/50'} ${showNumbers ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
            >
              {isRevealed ? val : ''}
            </motion.button>
          )
        })}
      </div>

      {/* Status overlays */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-red-500/50 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Juego Terminado!</h3>
              <p className="text-slate-300 mb-6">Tu memoria te ha fallado esta vez.</p>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); generateSequence(); }}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition-colors">
                Reintentar
              </button>
            </div>
          </motion.div>
        )}
        
        {win && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Memoria Perfecta!</h3>
              <p className="text-slate-300 mb-6">Has superado la Matriz de Memoria.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
