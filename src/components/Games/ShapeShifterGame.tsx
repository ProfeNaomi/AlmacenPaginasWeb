import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Star, Clock } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface ShapeShifterGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface Shape {
  id: string;
  type: 'circle' | 'square' | 'hexagon';
  fraction: number; // 0.25, 0.5, 0.75, 1
  x: number;
  y: number;
  speedX: number;
  speedY: number;
}

export default function ShapeShifterGame({ onWin, onClose }: ShapeShifterGameProps) {
  const { playSound } = useAudio();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetFraction = 0.5;
  const targetScore = 10;

  useEffect(() => {
    if (gameOver || win || showInstructions) return;

    const spawnInterval = setInterval(() => {
      if (shapes.length > 15) return; // limit shapes on screen

      const fractions = [0.25, 0.5, 0.5, 0.75, 1]; // More chance for 0.5
      const types: ('circle' | 'square' | 'hexagon')[] = ['circle', 'square', 'hexagon'];
      
      const newShape: Shape = {
        id: Math.random().toString(36).substring(7),
        type: types[Math.floor(Math.random() * types.length)],
        fraction: fractions[Math.floor(Math.random() * fractions.length)],
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
      };

      setShapes(prev => [...prev, newShape]);
    }, 1000);

    return () => clearInterval(spawnInterval);
  }, [shapes.length, gameOver, win]);

  // Game Loop for moving shapes
  useEffect(() => {
    if (gameOver || win || showInstructions) return;

    let animationFrameId: number;
    const updatePositions = () => {
      setShapes(prev => prev.map(shape => {
        let { x, y, speedX, speedY } = shape;
        x += speedX;
        y += speedY;
        if (x <= 0 || x >= 90) speedX *= -1;
        if (y <= 0 || y >= 90) speedY *= -1;
        return { ...shape, x, y, speedX, speedY };
      }));
      animationFrameId = requestAnimationFrame(updatePositions);
    };
    animationFrameId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, win]);

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

  const handleShapeClick = (shape: Shape) => {
    if (shape.fraction === targetFraction) {
      playSound('success');
      setScore(s => {
        const newScore = s + 1;
        if (newScore >= targetScore) {
          setWin(true);
          setTimeout(() => onWin?.(), 2000);
        }
        return newScore;
      });
    } else {
      playSound('error');
      // Penalty
      setTimeLeft(t => Math.max(0, t - 3));
    }
    // Remove shape after click
    setShapes(prev => prev.filter(s => s.id !== shape.id));
  };

  const renderShape = (shape: Shape) => {
    let path = "";
    if (shape.type === 'circle') {
      return (
         <div className="relative w-16 h-16 rounded-full border-4 border-slate-700 bg-slate-800 overflow-hidden">
           <div className="absolute bottom-0 left-0 w-full bg-cyan-500" style={{ height: `${shape.fraction * 100}%` }}></div>
         </div>
      );
    }
    if (shape.type === 'square') {
       return (
         <div className="relative w-16 h-16 border-4 border-slate-700 bg-slate-800 overflow-hidden">
           <div className="absolute bottom-0 left-0 w-full bg-fuchsia-500" style={{ height: `${shape.fraction * 100}%` }}></div>
         </div>
       );
    }
    // Hexagon approximation
    return (
         <div className="relative w-16 h-16 border-4 border-slate-700 bg-slate-800 overflow-hidden" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
           <div className="absolute bottom-0 left-0 w-full bg-amber-500" style={{ height: `${shape.fraction * 100}%` }}></div>
         </div>
    );
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 overflow-hidden relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Cambia Formas"
            instructions={`Observa las figuras geométricas moviéndose en la pantalla.\n\nDebes hacer CLIC únicamente en las figuras que tengan exactamente la MITAD (1/2) pintada.\nSi haces clic en otra fracción, perderás tiempo.`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
          <Clock className="w-5 h-5 text-amber-400" />
          <span className={`font-bold font-display ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="text-white font-bold text-xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
          Puntaje: {score} / {targetScore}
        </div>
      </div>

      {/* Center Target Info */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-center opacity-20">
           <div className="text-8xl font-black text-white">1/2</div>
           <div className="text-2xl font-bold text-white uppercase tracking-widest mt-4">Atrapa la Mitad</div>
        </div>
      </div>

      {/* Shapes Area */}
      <div className="flex-1 relative">
        <AnimatePresence>
          {shapes.map(shape => (
            <motion.div
              key={shape.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: `${shape.x}vw`, y: `${shape.y}vh` }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleShapeClick(shape)}
              className="absolute cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10"
              style={{ left: 0, top: 0 }}
            >
              {renderShape(shape)}
            </motion.div>
          ))}
        </AnimatePresence>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Tiempo Agotado!</h3>
              <button onClick={() => { setScore(0); setTimeLeft(30); setGameOver(false); setShapes([]); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Percepción Geométrica!</h3>
              <p className="text-slate-300 mb-6">Tienes un ojo entrenado para las fracciones.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
