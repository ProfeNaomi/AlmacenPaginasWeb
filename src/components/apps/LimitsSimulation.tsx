import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LimitsSimulation() {
  const [xValue, setXValue] = useState<number>(0);
  const [targetX] = useState<number>(1);

  // La función f(x) = (x^2 - 1) / (x - 1)
  const calculateY = (x: number) => {
    if (x === 1) return null; // Indefinido
    return (x * x - 1) / (x - 1);
  };

  const currentY = calculateY(xValue);

  return (
    <div className="w-full min-h-[500px] flex flex-col bg-slate-50 text-slate-800 p-8 rounded-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 font-display">
          Aproximación Numérica de un Límite
        </h2>
        <p className="text-slate-600 mt-2">
          ¿Qué pasa con <span className="font-mono bg-slate-200 px-2 rounded">f(x) = (x² - 1) / (x - 1)</span> cuando <span className="font-mono bg-slate-200 px-2 rounded">x</span> se acerca a <span className="font-mono bg-slate-200 px-2 rounded">1</span>?
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Controles */}
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="flex justify-between text-sm font-bold text-slate-500 mb-4">
            <span>x = {xValue.toFixed(4)}</span>
            <span>Objetivo: x → 1</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.0001"
            value={xValue}
            onChange={(e) => setXValue(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between mt-4">
            <button 
              onClick={() => setXValue(0.999)}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-bold text-sm transition-colors"
            >
              Acercarse por Izquierda
            </button>
            <button 
              onClick={() => setXValue(1.001)}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-bold text-sm transition-colors"
            >
              Acercarse por Derecha
            </button>
          </div>
        </div>

        {/* Visualización del Resultado */}
        <div className="w-full max-w-md">
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
            <div className="text-center">
              <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Entrada (x)</div>
              <div className="text-2xl font-mono">{xValue.toFixed(4)}</div>
            </div>
            
            <motion.div 
              animate={{ rotate: xValue === 1 ? 90 : 0 }}
              className="text-emerald-400"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </motion.div>

            <div className="text-center">
              <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Salida f(x)</div>
              <div className={`text-2xl font-mono ${xValue === 1 ? 'text-red-400' : 'text-cyan-400'}`}>
                {xValue === 1 ? 'Indefinido' : currentY?.toFixed(4)}
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {Math.abs(xValue - 1) < 0.01 && xValue !== 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-center font-medium"
              >
                ¡Observa! A medida que <span className="font-bold">x</span> se acerca a 1, <span className="font-bold">f(x)</span> se acerca claramente a 2. ¡Ese es el límite!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
