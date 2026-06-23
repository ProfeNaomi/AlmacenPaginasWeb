import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';
import { Heart, Clock } from 'lucide-react';
import GameInstructionsOverlay from './GameInstructionsOverlay';

interface AscendingBubblesGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

interface Bubble {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  popped: boolean;
}

export default function AscendingBubblesGame({ onWin, onClose }: AscendingBubblesGameProps) {
  const { playSound } = useAudio();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [targetValues, setTargetValues] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetScore = 5;

  const generateRound = () => {
    const numBubbles = 4 + score; // Increases difficulty
    const newBubbles: Bubble[] = [];
    const values = [];

    for (let i = 0; i < numBubbles; i++) {
      const val = Math.floor(Math.random() * 50) + 1;
      values.push(val);
      const offset = Math.floor(Math.random() * 10);
      const isAdd = Math.random() > 0.5;
      const label = isAdd ? `${val - offset} + ${offset}` : `${val + offset} - ${offset}`;

      newBubbles.push({
        id: Math.random().toString(),
        label,
        value: val,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() - 0.5) * 1.5,
        popped: false
      });
    }

    setBubbles(newBubbles);
    setTargetValues(values.sort((a, b) => a - b));
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (score < targetScore && !gameOver && !win && !showInstructions) {
      generateRound();
    }
  }, [score, gameOver, win]);

  // Movement Loop
  useEffect(() => {
    if (gameOver || win || showInstructions) return;
    let animationFrameId: number;
    const updatePositions = () => {
      setBubbles(prev => prev.map(bubble => {
        if (bubble.popped) return bubble;
        let { x, y, speedX, speedY } = bubble;
        x += speedX;
        y += speedY;
        if (x <= 0 || x >= 90) speedX *= -1;
        if (y <= 0 || y >= 90) speedY *= -1;
        return { ...bubble, x, y, speedX, speedY };
      }));
      animationFrameId = requestAnimationFrame(updatePositions);
    };
    animationFrameId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, win]);

  const handleBubbleClick = (bubble: Bubble) => {
    if (gameOver || win || bubble.popped) return;

    if (bubble.value === targetValues[currentIndex]) {
      playSound('success');
      setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, popped: true } : b));
      
      if (currentIndex + 1 === targetValues.length) {
        // Round complete
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
        setCurrentIndex(i => i + 1);
      }
    } else {
      playSound('error');
      setLives(l => {
        if (l - 1 <= 0) setGameOver(true);
        return l - 1;
      });
      // Briefly highlight error or shake bubble? Handled by sound and lives for now
    }
  };

  return (
    <div className="w-full min-h-[600px] flex flex-col bg-slate-950 overflow-hidden relative">
      <AnimatePresence>
        {showInstructions && (
          <GameInstructionsOverlay
            title="Burbujas Ascendentes"
            instructions={`Revienta las burbujas en orden ascendente (de MENOR a MAYOR) resolviendo las sumas o restas de cada una.\n\n¡Si revientas una burbuja en el orden incorrecto perderás una vida!`}
            onStart={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <Heart key={i} className={`w-8 h-8 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800'} transition-all`} />
          ))}
        </div>
        <div className="text-white font-bold text-xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700">
          Puntaje: {score} / {targetScore}
        </div>
      </div>

      {/* Center Target Info */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-center opacity-20">
           <div className="text-8xl font-black text-white">
             {targetValues[currentIndex] ? '↑' : ''}
           </div>
           <div className="text-2xl font-bold text-white uppercase tracking-widest mt-4">
             De menor a mayor
           </div>
        </div>
      </div>

      {/* Bubbles Area */}
      <div className="flex-1 relative">
        <AnimatePresence>
          {bubbles.map(bubble => (
            !bubble.popped && (
              <motion.button
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: `${bubble.x}vw`, y: `${bubble.y}vh` }}
                exit={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.3 }}
                onClick={() => handleBubbleClick(bubble)}
                className="absolute cursor-pointer w-24 h-24 sm:w-32 sm:h-32 bg-cyan-500/20 backdrop-blur-md border border-cyan-300 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:bg-cyan-500/40 active:scale-90 z-10"
                style={{ left: 0, top: 0 }}
              >
                {/* Highlight ring */}
                <div className="absolute inset-1 border-2 border-white/30 rounded-full pointer-events-none"></div>
                <div className="absolute w-4 h-4 bg-white/50 rounded-full top-4 left-4 blur-[2px] pointer-events-none"></div>
                
                <span className="text-white font-black text-xl sm:text-2xl drop-shadow-md">
                  {bubble.label}
                </span>
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
              <h3 className="text-3xl font-bold text-red-500 mb-4">¡Burbujas estalladas!</h3>
              <p className="text-slate-300 mb-6">Rompiste el orden ascendente.</p>
              <button onClick={() => { setScore(0); setLives(3); setGameOver(false); }}
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
              <h3 className="text-3xl font-bold text-emerald-400 mb-4">¡Orden Perfecto!</h3>
              <p className="text-slate-300">Tienes gran agilidad para ordenar.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
