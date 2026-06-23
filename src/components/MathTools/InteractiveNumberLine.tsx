import React, { useState } from 'react';
import { motion } from 'motion/react';
import MathNode from './MathNode';

export default function InteractiveNumberLine() {
  const [a, setA] = useState<number>(3);
  const [b, setB] = useState<number>(-5);

  const min = -10;
  const max = 10;
  
  // Constrain limits
  const clampedA = Math.max(min, Math.min(max, a));
  const result = clampedA + b;
  const clampedResult = Math.max(min, Math.min(max, result));
  
  const range = max - min;
  
  // Function to get left percentage for a given value on the number line
  const getPosition = (val: number) => ((val - min) / range) * 100;
  
  // Draw ticks
  const ticks = [];
  for (let i = min; i <= max; i++) {
    ticks.push(i);
  }

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl max-w-3xl w-full mx-auto my-8 font-sans">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-2">Suma de Enteros en la Recta Numérica</h3>
        <div className="text-2xl text-cyan-400 bg-slate-900 inline-block px-6 py-3 rounded-xl border border-slate-700 shadow-inner">
          <MathNode math={`${clampedA} + (${b}) = ${clampedResult}`} />
        </div>
      </div>

      {/* Number Line Visualization */}
      <div className="relative h-48 mt-12 mb-8 bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
        {/* The line itself */}
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-600 -translate-y-1/2 rounded-full"></div>
        
        {/* Ticks and Labels */}
        <div className="absolute top-1/2 left-4 right-4 h-8 -translate-y-1/2 pointer-events-none">
          {ticks.map((tick) => (
            <div 
              key={tick} 
              className="absolute top-0 flex flex-col items-center -translate-x-1/2"
              style={{ left: `${getPosition(tick)}%` }}
            >
              <div className={`w-0.5 h-3 ${tick === 0 ? 'bg-cyan-500 h-4' : 'bg-slate-500'}`}></div>
              <span className={`text-xs mt-2 font-mono ${tick === 0 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                {tick}
              </span>
            </div>
          ))}
        </div>

        {/* Arrow for 'A' */}
        <div className="absolute top-1/2 left-4 right-4 h-full -translate-y-1/2 pointer-events-none">
          <motion.div 
            initial={false}
            animate={{
              left: `${getPosition(Math.min(0, clampedA))}%`,
              width: `${Math.abs(getPosition(clampedA) - getPosition(0))}%`,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className={`absolute top-1/4 h-2 rounded-full opacity-80 ${clampedA >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
          />
          {/* A Label */}
          <motion.div
            initial={false}
            animate={{ left: `${getPosition(clampedA / 2)}%` }}
            className="absolute top-4 -translate-x-1/2 -mt-6"
          >
            <span className={`text-sm font-bold ${clampedA >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              a = {clampedA}
            </span>
          </motion.div>
        </div>

        {/* Arrow for 'B' starting from 'A' */}
        <div className="absolute top-1/2 left-4 right-4 h-full -translate-y-1/2 pointer-events-none">
          <motion.div 
            initial={false}
            animate={{
              left: `${getPosition(Math.min(clampedA, result))}%`,
              width: `${Math.abs(getPosition(result) - getPosition(clampedA))}%`,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
            className={`absolute bottom-1/4 h-2 rounded-full opacity-80 ${b >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}
          />
          {/* B Label */}
          <motion.div
            initial={false}
            animate={{ left: `${getPosition(clampedA + (b / 2))}%` }}
            className="absolute bottom-4 -translate-x-1/2 mt-2"
          >
            <span className={`text-sm font-bold ${b >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
              b = {b}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="flex justify-between text-sm font-medium text-slate-300">
            <span>Valor Inicial (a):</span>
            <span className={clampedA >= 0 ? 'text-blue-400' : 'text-red-400'}>{clampedA}</span>
          </label>
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={a} 
            onChange={(e) => setA(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex justify-between text-sm font-medium text-slate-300">
            <span>Sumando (b):</span>
            <span className={b >= 0 ? 'text-emerald-400' : 'text-orange-400'}>{b}</span>
          </label>
          <input 
            type="range" 
            min={-10} 
            max={10} 
            value={b} 
            onChange={(e) => setB(parseInt(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-slate-500 bg-slate-900/50 p-4 rounded-xl">
        <p>Ajusta los controles deslizantes para ver cómo se mueven los vectores en la recta.</p>
      </div>
    </div>
  );
}
