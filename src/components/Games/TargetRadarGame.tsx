import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, Target } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface TargetRadarGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface Asteroid {
  id: string;
  value: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  isTarget: boolean;
  clicked: boolean;
}

export default function TargetRadarGame({ onWin, onClose }: TargetRadarGameProps) {
  const { playSound } = useAudio();
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [targetMultiplier, setTargetMultiplier] = useState(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetScore = 15;
  const playAreaRef = useRef<HTMLDivElement>(null);

  const spawnAsteroid = () => {
    const isTarget = Math.random() > 0.6;
    let val;
    if (isTarget) {
      val = targetMultiplier * (Math.floor(Math.random() * 10) + 1);
    } else {
      val = Math.floor(Math.random() * 50) + 1;
      if (val % targetMultiplier === 0) val += 1; // ensure not multiple
    }

    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0, speedX = 0, speedY = 0;
    const baseSpeed = 0.5 + (score * 0.05);

    if (side === 0) { // Top
      x = Math.random() * 90; y = -10;
      speedX = (Math.random() - 0.5) * baseSpeed;
      speedY = Math.random() * baseSpeed + 0.2;
    } else if (side === 1) { // Right
      x = 100; y = Math.random() * 90;
      speedX = -(Math.random() * baseSpeed + 0.2);
      speedY = (Math.random() - 0.5) * baseSpeed;
    } else if (side === 2) { // Bottom
      x = Math.random() * 90; y = 100;
      speedX = (Math.random() - 0.5) * baseSpeed;
      speedY = -(Math.random() * baseSpeed + 0.2);
    } else { // Left
      x = -10; y = Math.random() * 90;
      speedX = Math.random() * baseSpeed + 0.2;
      speedY = (Math.random() - 0.5) * baseSpeed;
    }

    setAsteroids(prev => [...prev, {
      id: Math.random().toString(),
      value: val,
      x, y, speedX, speedY,
      isTarget,
      clicked: false
    }]);
  };

  useEffect(() => {
    if (gameOver || win || showInstructions) return;
    const interval = setInterval(spawnAsteroid, Math.max(800 - (score * 20), 400));
    return () => clearInterval(interval);
  }, [score, gameOver, win, targetMultiplier]);

  useEffect(() => {
    if (gameOver || win || showInstructions) return;
    let animationFrameId: number;
    const update = () => {
      setAsteroids(prev => {
        const next = prev.map(a => {
          if (a.clicked) return a;
          return { ...a, x: a.x + a.speedX, y: a.y + a.speedY };
        }).filter(a => {
          // Remove if way out of bounds
          const out = (a.x < -20 || a.x > 120 || a.y < -20 || a.y > 120);
          if (out && a.isTarget && !a.clicked && !gameOver) {
            // Missed a target!
            // It's too punishing to lose a life if they miss one, maybe just let it slide or lose 1 life.
            // Let's not punish missing for now to keep it fun, just punish wrong clicks.
          }
          return !out;
        });
        return next;
      });
      animationFrameId = requestAnimationFrame(update);
    };
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, win]);

  const handleAsteroidClick = (a: Asteroid) => {
    if (gameOver || win || a.clicked) return;

    if (a.isTarget) {
      playSound('success');
      setAsteroids(prev => prev.map(ast => ast.id === a.id ? { ...ast, clicked: true } : ast));
      setScore(s => {
        if (s + 1 >= targetScore) {
          setWin(true);
          setTimeout(() => onWin?.(), 2000);
        }
        // Maybe change multiplier every 5 points
        if ((s + 1) % 5 === 0 && s + 1 < targetScore) {
           setTargetMultiplier(m => m === 3 ? 4 : m === 4 ? 5 : 3);
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
            title="Radar Objetivo"
            instructions={`Un número objetivo aparecerá en el centro del radar.\n\nVarios números volarán por la pantalla. Toca ÚNICAMENTE el número que coincida con tu objetivo.\n\n¡Si tocas el incorrecto, perderás una vida!`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <Heart key={i} className={`w-6 h-6 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800'} transition-all`} />
          ))}
        </div>
        <div className="text-cyan-400 font-bold text-xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
          {score}/{targetScore}
        </div>
      </div>

      {/* Center Target Info */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-center opacity-30">
           <Target className="w-32 h-32 text-cyan-500 mx-auto mb-4" />
           <div className="text-4xl font-black text-white uppercase tracking-widest">
             Múltiplos de {targetMultiplier}
           </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative" ref={playAreaRef}>
        <AnimatePresence>
          {asteroids.map(a => (
            !a.clicked && (
              <motion.button
                key={a.id}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: `${a.x}vw`, y: `${a.y}vh` }}
                exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                onClick={() => handleAsteroidClick(a)}
                className="absolute w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 border-2 border-slate-600 rounded-2xl flex items-center justify-center shadow-lg hover:border-cyan-400 active:scale-90 transition-colors"
                style={{ left: 0, top: 0, transform: `translate(-50%, -50%)` }}
              >
                <span className="text-white font-black text-2xl">{a.value}</span>
              </motion.button>
            )
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Impacto Directo!</h3>
              <p className="text-slate-300">Destruiste el objetivo equivocado.</p>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); setAsteroids([]); setTargetMultiplier(3); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Radar Limpio!</h3>
              <p className="text-slate-300">Excelente atención dividida.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
