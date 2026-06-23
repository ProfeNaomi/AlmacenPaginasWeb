import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface GameInstructionsOverlayProps {
  title: string;
  instructions: string;
  onStart: () => void;
}

export default function GameInstructionsOverlay({ title, instructions, onStart }: GameInstructionsOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6"
    >
      <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-lg w-full">
        <h2 className="text-3xl font-black text-white mb-4 tracking-wider uppercase">{title}</h2>
        <p className="text-slate-300 text-lg mb-8 leading-relaxed whitespace-pre-line">
          {instructions}
        </p>
        <button 
          onClick={onStart}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-xl px-10 py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto gap-3"
        >
          <Play className="w-6 h-6 fill-current" /> ¡EMPEZAR JUEGO!
        </button>
      </div>
    </motion.div>
  );
}
