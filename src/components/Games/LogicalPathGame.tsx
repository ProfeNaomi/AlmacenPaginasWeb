import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, RefreshCw } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface LogicalPathGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

export default function LogicalPathGame({ onWin, onClose }: LogicalPathGameProps) {
  const { playSound } = useAudio();
  const [grid, setGrid] = useState<number[]>([]);
  const [targetSum, setTargetSum] = useState(0);
  const [path, setPath] = useState<number[]>([]); // array of indices
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const gridSize = 4;
  const targetScore = 5;
  const gridRef = useRef<HTMLDivElement>(null);

  const generateLevel = () => {
    // Create a 4x4 grid of small numbers
    const newGrid = Array.from({ length: 16 }, () => Math.floor(Math.random() * 9) + 1);
    setGrid(newGrid);
    setPath([]);
    
    // Generate a valid path of length 3-5
    const pathLen = Math.floor(Math.random() * 3) + 3;
    let currentIdx = Math.floor(Math.random() * 16);
    let sum = newGrid[currentIdx];
    const tempPath = [currentIdx];
    
    for (let i = 1; i < pathLen; i++) {
      // Get valid neighbors (up, down, left, right)
      const neighbors = [];
      const row = Math.floor(currentIdx / 4);
      const col = currentIdx % 4;
      if (row > 0) neighbors.push(currentIdx - 4);
      if (row < 3) neighbors.push(currentIdx + 4);
      if (col > 0) neighbors.push(currentIdx - 1);
      if (col < 3) neighbors.push(currentIdx + 1);
      
      // Filter unvisited
      const unvisited = neighbors.filter(n => !tempPath.includes(n));
      if (unvisited.length === 0) break;
      
      const nextIdx = unvisited[Math.floor(Math.random() * unvisited.length)];
      sum += newGrid[nextIdx];
      tempPath.push(nextIdx);
      currentIdx = nextIdx;
    }
    
    setTargetSum(sum);
  };

  useEffect(() => {
    generateLevel();
  }, [score]);

  const handleClick = (idx: number) => {
    if (gameOver || win || showInstructions) return;
    
    if (path.length === 0) {
      playSound('click');
      setPath([idx]);
    } else {
      const lastIdx = path[path.length - 1];
      const r1 = Math.floor(lastIdx / 4);
      const c1 = lastIdx % 4;
      const r2 = Math.floor(idx / 4);
      const c2 = idx % 4;
      
      const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
      
      if (isAdjacent && !path.includes(idx)) {
        playSound('click');
        const newPath = [...path, idx];
        setPath(newPath);
        
        const sum = newPath.reduce((acc, curr) => acc + grid[curr], 0);
        if (sum === targetSum) {
          setTimeout(() => {
            playSound('success');
            setScore(s => {
              if (s + 1 >= targetScore) {
                setWin(true);
                setTimeout(() => onWin?.(), 2000);
              }
              return s + 1;
            });
          }, 200);
        } else if (sum > targetSum) {
          setTimeout(() => {
            playSound('error');
            setLives(l => {
              if (l - 1 <= 0) setGameOver(true);
              return l - 1;
            });
            setPath([]);
          }, 200);
        }
      } else if (path.includes(idx) && idx === lastIdx) {
         // Undo last step
         playSound('click');
         setPath(path.slice(0, -1));
      }
    }
  };

  const currentSum = path.reduce((acc, idx) => acc + grid[idx], 0);

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 p-6 relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Camino Lógico"
            instructions={`Haz clic en los números adyacentes (arriba, abajo, izquierda, derecha) para formar un camino.\n\nLa suma de los números en tu camino debe ser igual al Número Objetivo gigante.\n\nSi te pasas del número, pierdes una vida y el camino se reinicia.`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <Heart key={i} className={`w-6 h-6 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800'} transition-all`} />
          ))}
        </div>
        <div className="text-cyan-400 font-bold text-xl">
          Nivel {score + 1}/{targetScore}
        </div>
      </div>

      {/* Target Area */}
      <div className="flex flex-col items-center justify-center mb-10">
        <h2 className="text-slate-400 uppercase tracking-widest font-bold mb-2">Encuentra el camino que sume:</h2>
        <div className="text-7xl font-black text-white bg-slate-900 px-12 py-4 rounded-3xl border border-slate-800 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
          {targetSum}
        </div>
        <div className={`mt-4 text-2xl font-bold transition-colors ${currentSum === targetSum ? 'text-emerald-400' : currentSum > targetSum ? 'text-red-500' : 'text-cyan-500'}`}>
          Suma actual: {currentSum}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex justify-center items-center">
        <div 
          ref={gridRef}
          className="grid grid-cols-4 gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800"
        >
          {grid.map((num, idx) => {
            const isSelected = path.includes(idx);
            const isLast = path[path.length - 1] === idx;

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClick(idx)}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl text-3xl font-bold cursor-pointer select-none transition-colors ${isSelected ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] border-2 border-cyan-300' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}
              >
                {num}
              </motion.div>
            )
          })}
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Caminos agotados!</h3>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); generateLevel(); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Calculadora Humana!</h3>
              <p className="text-slate-300">Has trazado todas las rutas matemáticas.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
