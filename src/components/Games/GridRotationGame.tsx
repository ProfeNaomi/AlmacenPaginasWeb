import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, RotateCw, RotateCcw } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface GridRotationGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function GridRotationGame({ onWin, onClose }: GridRotationGameProps) {
  const { playSound } = useAudio();
  const [originalGrid, setOriginalGrid] = useState<boolean[]>(Array(9).fill(false));
  const [playerGrid, setPlayerGrid] = useState<boolean[]>(Array(9).fill(false));
  const [rotation, setRotation] = useState<'cw' | 'ccw'>('cw');
  const [isShowingOriginal, setIsShowingOriginal] = useState(true);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const gridSize = 3; // 3x3
  const targetScore = 5;

  const generateRound = () => {
    const newGrid = Array(9).fill(false);
    const numBlocks = Math.floor(Math.random() * 2) + 3; // 3 or 4 blocks
    let placed = 0;
    while (placed < numBlocks) {
      const idx = Math.floor(Math.random() * 9);
      if (!newGrid[idx]) {
        newGrid[idx] = true;
        placed++;
      }
    }
    setOriginalGrid(newGrid);
    setPlayerGrid(Array(9).fill(false));
    setRotation(Math.random() > 0.5 ? 'cw' : 'ccw');
    setIsShowingOriginal(true);
    
    // Show original for 2.5 seconds, then hide and show empty grid
    setTimeout(() => {
      setIsShowingOriginal(false);
    }, 2500);
  };

  useEffect(() => {
    if (score < targetScore && !gameOver && !win && !showInstructions) {
      generateRound();
    }
  }, [score, gameOver, win]);

  const getRotatedIndex = (idx: number, rot: 'cw' | 'ccw') => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    if (rot === 'cw') {
      // (r, c) -> (c, 2-r)
      return c * 3 + (2 - r);
    } else {
      // (r, c) -> (2-c, r)
      return (2 - c) * 3 + r;
    }
  };

  const checkWin = (currentGrid: boolean[]) => {
    const activeCount = currentGrid.filter(Boolean).length;
    const targetActiveCount = originalGrid.filter(Boolean).length;
    
    if (activeCount !== targetActiveCount) return;

    for (let i = 0; i < 9; i++) {
      if (originalGrid[i]) {
        const rotatedIdx = getRotatedIndex(i, rotation);
        if (!currentGrid[rotatedIdx]) {
          // Incorrect
          playSound('error');
          setLives(l => {
            if (l - 1 <= 0) setGameOver(true);
            return l - 1;
          });
          setPlayerGrid(Array(9).fill(false));
          return;
        }
      }
    }

    // Correct
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
  };

  const handleCellClick = (idx: number) => {
    if (isShowingOriginal || gameOver || win) return;
    playSound('click');
    const newGrid = [...playerGrid];
    newGrid[idx] = !newGrid[idx];
    setPlayerGrid(newGrid);
    checkWin(newGrid);
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 items-center justify-center relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Rotación de Rejilla"
            instructions={`Observa la figura en la rejilla y la dirección de rotación.\n\nCuando desaparezca, reconstruye la figura como quedaría DESPUÉS de haber rotado 90 grados en la dirección indicada.\n\nToca los cuadros para marcarlos.`}
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

      <div className="text-center mb-8 mt-10">
        <h2 className="text-4xl font-black text-white uppercase tracking-widest">Rotación Mental</h2>
        <p className="text-slate-400 mt-2">
          {isShowingOriginal ? 'Memoriza la posición' : '¿Dónde quedarían tras rotar 90º?'}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center justify-center gap-4 text-cyan-400">
          {rotation === 'cw' ? (
            <>
               <span className="font-bold uppercase tracking-widest">Rotar Derecha (90º)</span>
               <RotateCw className="w-8 h-8" />
            </>
          ) : (
            <>
               <RotateCcw className="w-8 h-8" />
               <span className="font-bold uppercase tracking-widest">Rotar Izquierda (-90º)</span>
            </>
          )}
        </div>

        <div className="relative">
          {/* The Grid */}
          <motion.div
            animate={isShowingOriginal ? { rotate: 0 } : { rotate: rotation === 'cw' ? 90 : -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
            className={`grid grid-cols-3 gap-2 bg-slate-800 p-3 rounded-2xl ${isShowingOriginal ? 'block' : 'hidden absolute'}`}
          >
            {originalGrid.map((active, idx) => (
              <div key={idx} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl ${active ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isShowingOriginal ? 0 : 1 }}
            className={`grid grid-cols-3 gap-2 bg-slate-800 p-3 rounded-2xl ${!isShowingOriginal ? 'block' : 'hidden absolute'}`}
          >
            {playerGrid.map((active, idx) => (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl transition-colors ${active ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}
              ></button>
            ))}
          </motion.div>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Desorientación!</h3>
              <p className="text-slate-300">Calculaste mal la rotación.</p>
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Percepción Espacial Perfecta!</h3>
              <p className="text-slate-300">Tu rotación mental es excelente.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
