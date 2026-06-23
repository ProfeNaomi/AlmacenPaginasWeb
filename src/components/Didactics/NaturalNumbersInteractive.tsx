import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, RotateCcw, Box, ArrowRight } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const Block = ({ color, delay }: { color: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.5 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.5 }}
    transition={{ type: "spring", stiffness: 300, damping: 20, delay }}
    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg border-b-4 flex items-center justify-center relative overflow-hidden ${color}`}
  >
    <div className="absolute inset-0 bg-white/20" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 50%)' }}></div>
    <Box className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" strokeWidth={1.5} />
  </motion.div>
);

const MathEquation = ({ groupA, groupB }: { groupA: number, groupB: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const total = groupA + groupB;

  useEffect(() => {
    if (containerRef.current) {
      const equation = `${groupA} + ${groupB} = ${total}`;
      katex.render(equation, containerRef.current, {
        throwOnError: false,
        displayMode: true,
      });
    }
  }, [groupA, groupB, total]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"></div>
      <span className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-widest">Traducción Simbólica</span>
      <div ref={containerRef} className="text-3xl sm:text-5xl text-white font-serif"></div>
    </div>
  );
};

export default function NaturalNumbersInteractive() {
  const [groupA, setGroupA] = useState(0);
  const [groupB, setGroupB] = useState(0);

  const maxBlocks = 9;

  const reset = () => {
    setGroupA(0);
    setGroupB(0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
              Juntando cantidades
            </h2>
            <p className="text-slate-300 max-w-xl text-lg">
              La suma surge de la necesidad de juntar cosas. Agrega bloques a cada grupo y observa cómo la matemática "traduce" lo que haces con las manos.
            </p>
          </div>
          <button 
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-600 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interaction Area */}
        <div className="space-y-6">
          
          {/* Grupo A */}
          <div className="bg-slate-800/40 border border-pink-500/30 rounded-3xl p-6 backdrop-blur-sm relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/50">1</span>
                Primer Grupo
              </h3>
              <div className="flex bg-slate-900/80 rounded-xl overflow-hidden border border-slate-700">
                <button 
                  onClick={() => setGroupA(Math.max(0, groupA - 1))}
                  disabled={groupA === 0}
                  className="p-3 text-pink-400 hover:bg-pink-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="px-4 py-3 bg-slate-800 font-bold text-white min-w-[3rem] text-center">
                  {groupA}
                </div>
                <button 
                  onClick={() => setGroupA(Math.min(maxBlocks, groupA + 1))}
                  disabled={groupA === maxBlocks}
                  className="p-3 text-pink-400 hover:bg-pink-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="min-h-[100px] sm:min-h-[140px] flex flex-wrap gap-3 items-start justify-start p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-inner">
              <AnimatePresence>
                {Array.from({ length: groupA }).map((_, i) => (
                  <Block key={`A-${i}`} color="bg-gradient-to-br from-pink-400 to-rose-600 border-rose-800" delay={0.05 * i} />
                ))}
              </AnimatePresence>
              {groupA === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-600 italic">
                  Vacío
                </div>
              )}
            </div>
          </div>

          {/* Grupo B */}
          <div className="bg-slate-800/40 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-sm relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">2</span>
                Segundo Grupo
              </h3>
              <div className="flex bg-slate-900/80 rounded-xl overflow-hidden border border-slate-700">
                <button 
                  onClick={() => setGroupB(Math.max(0, groupB - 1))}
                  disabled={groupB === 0}
                  className="p-3 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="px-4 py-3 bg-slate-800 font-bold text-white min-w-[3rem] text-center">
                  {groupB}
                </div>
                <button 
                  onClick={() => setGroupB(Math.min(maxBlocks, groupB + 1))}
                  disabled={groupB === maxBlocks}
                  className="p-3 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="min-h-[100px] sm:min-h-[140px] flex flex-wrap gap-3 items-start justify-start p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-inner">
              <AnimatePresence>
                {Array.from({ length: groupB }).map((_, i) => (
                  <Block key={`B-${i}`} color="bg-gradient-to-br from-cyan-400 to-blue-600 border-blue-800" delay={0.05 * i} />
                ))}
              </AnimatePresence>
              {groupB === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-600 italic">
                  Vacío
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Translation Area */}
        <div className="flex flex-col gap-6">
          <MathEquation groupA={groupA} groupB={groupB} />
          
          <motion.div 
            className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-slate-700/50 flex-1 flex flex-col items-center justify-center shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Total Juntado</h3>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800 w-full min-h-[200px] relative z-10">
              <AnimatePresence>
                {Array.from({ length: groupA }).map((_, i) => (
                  <Block key={`TotalA-${i}`} color="bg-gradient-to-br from-pink-400 to-rose-600 border-rose-800" />
                ))}
                {Array.from({ length: groupB }).map((_, i) => (
                  <Block key={`TotalB-${i}`} color="bg-gradient-to-br from-cyan-400 to-blue-600 border-blue-800" />
                ))}
              </AnimatePresence>
              {groupA + groupB === 0 && (
                <div className="text-slate-600 italic text-lg">
                  Agrega bloques para ver el resultado
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center relative z-10">
              <p className="text-slate-400">
                Al sumar <strong className="text-pink-400">{groupA}</strong> y <strong className="text-cyan-400">{groupB}</strong>, obtenemos un conjunto total de <strong className="text-white text-xl">{groupA + groupB}</strong> bloques.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
