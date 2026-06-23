import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { CheckCircle2, XCircle, Timer } from 'lucide-react';

export interface BinaryItem {
  id: string;
  value: number;
  isEven: boolean;
}

interface ClasificacionBinariaGameProps {
  items?: BinaryItem[];
  onFinish?: (stars: number, score: number) => void;
  onWin?: () => void;
  onClose?: () => void;
}

const generateBinaryItems = (): BinaryItem[] => {
  const items: BinaryItem[] = [];
  for (let i = 0; i < 25; i++) {
    const val = Math.floor(Math.random() * 99) + 1;
    items.push({
      id: `item-${i}-${val}`,
      value: val,
      isEven: val % 2 === 0
    });
  }
  return items;
};

export default function ClasificacionBinariaGame({ items, onFinish, onWin, onClose }: ClasificacionBinariaGameProps) {
  const [gameItems, setGameItems] = useState<BinaryItem[]>(items || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const controls = useAnimation();
  const [exitX, setExitX] = useState<number | string>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!items || items.length === 0) {
      setGameItems(generateBinaryItems());
    }
  }, [items]);

  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0 || (gameItems.length > 0 && currentIndex >= gameItems.length)) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, currentIndex, gameItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleSwipe('left');
      else if (e.key === 'ArrowRight') handleSwipe('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isFinished || isProcessing) return;
    setIsProcessing(true);
    const isEvenAnswer = direction === 'left';
    const currentItem = gameItems[currentIndex];
    
    const isCorrect = currentItem.isEven === isEvenAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setExitX(direction === 'left' ? -300 : 300);
    
    await controls.start({
      x: direction === 'left' ? -300 : 300,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    nextItem();
  };

  const nextItem = () => {
    if (currentIndex + 1 < gameItems.length) {
      setCurrentIndex(prev => prev + 1);
      setExitX(0);
      controls.set({ x: 0, opacity: 1, rotate: 0 });
      setIsProcessing(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (isFinished) return;
    setIsFinished(true);
    let stars = 1;
    const ratio = score / gameItems.length;
    if (ratio >= 0.8) stars = 3;
    else if (ratio >= 0.5) stars = 2;
    else stars = 1;
    if (onFinish) onFinish(stars, score);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x < -swipeThreshold) {
      handleSwipe('left');
    } else if (info.offset.x > swipeThreshold) {
      handleSwipe('right');
    } else {
      controls.start({ x: 0, opacity: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-3xl shadow-2xl w-full h-full mx-auto text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-6">¡Clasificación Completa!</h2>
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className="text-5xl font-black text-emerald-400">{score}</span>
          <span className="text-2xl text-slate-400">/ {gameItems.length}</span>
        </div>
        <div className="flex gap-4 justify-center">
          {onClose && (
            <button onClick={onClose} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">
              Volver
            </button>
          )}
          {onWin && score / gameItems.length >= 0.5 && (
            <button onClick={onWin} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-colors shadow-lg shadow-cyan-500/50">
              Continuar
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const currentItem = gameItems[currentIndex];
  if (!currentItem) return null;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 h-full w-full mx-auto rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Header Info */}
      <div className="w-full flex justify-between items-center absolute top-6 px-6 z-10">
        <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full">
          <Timer className={timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"} />
          <span className={`font-mono font-bold text-xl ${timeLeft <= 10 ? "text-red-400" : "text-cyan-400"}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="text-slate-400 font-medium bg-slate-800 px-4 py-2 rounded-full">
          {currentIndex + 1} / {gameItems.length}
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-full font-bold text-emerald-400">
          Pts: {score}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 absolute top-0 left-0">
        <motion.div 
          className="h-full bg-cyan-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      {/* Swipe Zones Indications */}
      <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-8 md:px-24 z-0">
        <div className="flex flex-col items-center justify-center opacity-30 text-blue-400">
          <span className="text-5xl font-black">&larr;</span>
          <span className="font-bold text-2xl mt-2">PAR</span>
        </div>
        <div className="flex flex-col items-center justify-center opacity-30 text-rose-400">
          <span className="text-5xl font-black">&rarr;</span>
          <span className="font-bold text-2xl mt-2">IMPAR</span>
        </div>
      </div>

      {/* Cards Stack Container */}
      <div className="relative w-64 h-80 flex items-center justify-center z-10 mt-8">
        <AnimatePresence>
          <motion.div
            key={currentItem.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ scale: 0.8, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
            whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            className="absolute w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-600 flex items-center justify-center cursor-grab select-none"
            style={{ touchAction: "none" }}
          >
            <div className="text-8xl font-black text-white drop-shadow-lg">
              {currentItem.value}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-12 mt-12 z-10">
        <button 
          onClick={() => handleSwipe('left')}
          className="flex flex-col items-center justify-center bg-slate-800 border-2 border-blue-500/50 hover:bg-blue-500/20 text-blue-400 rounded-full w-24 h-24 shadow-lg transition-colors"
        >
          <span className="font-bold text-xl">PAR</span>
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="flex flex-col items-center justify-center bg-slate-800 border-2 border-rose-500/50 hover:bg-rose-500/20 text-rose-400 rounded-full w-24 h-24 shadow-lg transition-colors"
        >
          <span className="font-bold text-xl">IMPAR</span>
        </button>
      </div>
      
    </div>
  );
}
