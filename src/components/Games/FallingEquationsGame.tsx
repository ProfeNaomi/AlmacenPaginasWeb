import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Star, Heart } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface FallingEquationsGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface FallingBlock {
  id: string;
  equation: string;
  answer: number;
  xPos: number;
}

export default function FallingEquationsGame({ onWin, onClose }: FallingEquationsGameProps) {
  const { playSound } = useAudio();
  const [blocks, setBlocks] = useState<FallingBlock[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetScore = 10;

  const containers = [2, 5, 7, 9]; // Example fixed answers for this level

  useEffect(() => {
    if (gameOver || win || showInstructions) return;

    const spawnInterval = setInterval(() => {
      const answers = containers;
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      const randomOffset = Math.floor(Math.random() * 5) + 1;
      const startNum = randomAnswer + randomOffset;
      const equation = `${startNum} - ? = ${randomOffset}`;
      
      const newBlock: FallingBlock = {
        id: Math.random().toString(36).substring(7),
        equation,
        answer: randomAnswer,
        xPos: Math.floor(Math.random() * 70) + 10, // 10% to 80%
      };

      setBlocks(prev => [...prev, newBlock]);
    }, Math.max(1500, 3000 - score * 150)); // Spawns faster as score increases

    return () => clearInterval(spawnInterval);
  }, [score, gameOver, win]);

  const handleDragEnd = (event: any, info: any, block: FallingBlock) => {
    // Simple bounding box logic or y-axis threshold
    const dropY = info.point.y;
    const windowHeight = window.innerHeight;
    
    // If dropped near the bottom (where containers are)
    if (dropY > windowHeight - 200) {
      // Determine which container it landed on by X coordinate
      const dropX = info.point.x;
      const containerWidth = window.innerWidth / containers.length;
      const containerIndex = Math.floor(dropX / containerWidth);
      
      if (containerIndex >= 0 && containerIndex < containers.length) {
        const selectedAnswer = containers[containerIndex];
        if (selectedAnswer === block.answer) {
          playSound('success');
          setScore(s => s + 1);
          if (score + 1 >= targetScore) {
            setWin(true);
            setTimeout(() => onWin?.(), 2000);
          }
        } else {
          playSound('error');
          setLives(l => l - 1);
          if (lives <= 1) setGameOver(true);
        }
      }
    }
    
    // Remove block regardless of correct/incorrect if dropped
    setBlocks(prev => prev.filter(b => b.id !== block.id));
  };

  // To handle blocks falling off screen
  useEffect(() => {
    const fallInterval = setInterval(() => {
      // For a real game loop we'd track Y positions, but framer-motion handles the animation.
      // We'll just set a timeout to remove blocks if they aren't dragged.
    }, 1000);
    return () => clearInterval(fallInterval);
  }, []);

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 overflow-hidden relative" ref={gameAreaRef}>
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Ecuaciones en Caída"
            instructions={`Arrastra las ecuaciones que caen hacia el contenedor que tenga la respuesta correcta en la parte inferior.\n\nTienes 3 vidas. ¡Sé rápido antes de que se estrellen!`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <Heart key={i} className={`w-8 h-8 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800'} transition-all`} />
          ))}
        </div>
        <div className="text-white font-bold text-2xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
          Puntaje: {score} / {targetScore}
        </div>
      </div>

      {/* Falling Blocks Area */}
      <div className="flex-1 relative">
        <AnimatePresence>
          {blocks.map(block => (
            <motion.div
              key={block.id}
              initial={{ y: -100, x: `${block.xPos}vw` }}
              animate={{ y: '100vh' }}
              transition={{ duration: Math.max(4, 8 - score * 0.3), ease: 'linear' }}
              drag
              dragMomentum={false}
              onDragEnd={(e, info) => handleDragEnd(e, info, block)}
              onAnimationComplete={() => {
                if (!gameOver && !win && blocks.find(b => b.id === block.id)) {
                  // Block fell out of bounds without being caught
                  playSound('error');
                  setLives(l => l - 1);
                  if (lives <= 1) setGameOver(true);
                  setBlocks(prev => prev.filter(b => b.id !== block.id));
                }
              }}
              className="absolute top-0 p-4 bg-indigo-600/90 border border-indigo-400 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.5)] cursor-grab active:cursor-grabbing z-20 backdrop-blur-sm"
            >
              <span className="text-white font-bold text-2xl">{block.equation}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Containers at bottom */}
      <div className="h-40 flex w-full border-t border-slate-800 bg-slate-900/80 z-10">
        {containers.map((ans, idx) => (
          <div 
            key={idx} 
            className="flex-1 border-r border-slate-800 last:border-r-0 flex flex-col items-center justify-center relative"
          >
            <div className="w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent absolute top-0 opacity-50"></div>
            <div className="text-6xl font-black text-slate-700 pointer-events-none">
              {ans}
            </div>
            <div className="text-cyan-400 font-bold tracking-widest mt-2 uppercase text-sm">Contenedor</div>
          </div>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Demasiados errores!</h3>
              <p className="text-slate-300 mb-6">Los bloques se han estrellado.</p>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); setBlocks([]); }}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold">
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Velocidad Imparable!</h3>
              <p className="text-slate-300 mb-6">Has clasificado todas las ecuaciones a tiempo.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
