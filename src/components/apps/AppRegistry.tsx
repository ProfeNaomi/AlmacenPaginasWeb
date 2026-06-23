import React, { Suspense, lazy } from 'react';

// Registro de Aplicaciones Interactivas Personalizadas
// Para agregar una nueva app, añádela a este registro usando lazy loading.
const appRegistry: Record<string, React.LazyExoticComponent<any>> = {
  'LimitsSimulation': lazy(() => import('./LimitsSimulation')),
  'ContraRelojGame': lazy(() => import('../Games/ContraRelojGame')),
  'ClasificacionBinariaGame': lazy(() => import('../Games/ClasificacionBinariaGame')),
  'ElIntrusoGame': lazy(() => import('../Games/ElIntrusoGame')),
  'LaSecuenciaGame': lazy(() => import('../Games/LaSecuenciaGame')),
  'ParejasGame': lazy(() => import('../Games/ParejasGame')),
  'LaBalanzaGame': lazy(() => import('../Games/LaBalanzaGame')),
  'MemoryMatrixGame': lazy(() => import('../Games/MemoryMatrixGame')),
  'FallingEquationsGame': lazy(() => import('../Games/FallingEquationsGame')),
  'ShapeShifterGame': lazy(() => import('../Games/ShapeShifterGame')),
  'DualTaskGame': lazy(() => import('../Games/DualTaskGame')),
  'LogicalPathGame': lazy(() => import('../Games/LogicalPathGame')),
  'SimonSaysMathGame': lazy(() => import('../Games/SimonSaysMathGame')),
  'NBackMathGame': lazy(() => import('../Games/NBackMathGame')),
  'StroopMathGame': lazy(() => import('../Games/StroopMathGame')),
  'AscendingBubblesGame': lazy(() => import('../Games/AscendingBubblesGame')),
  'SymmetricalReflexGame': lazy(() => import('../Games/SymmetricalReflexGame')),
  'SafeCrackersGame': lazy(() => import('../Games/SafeCrackersGame')),
  'MissingPieceGame': lazy(() => import('../Games/MissingPieceGame')),
  'TargetRadarGame': lazy(() => import('../Games/TargetRadarGame')),
  'GridRotationGame': lazy(() => import('../Games/GridRotationGame')),
};

interface CustomAppRendererProps {
  name: string;
  onWin?: () => void;
  onClose?: () => void;
}

export const CustomAppRenderer: React.FC<CustomAppRendererProps> = ({ name, onWin, onClose }) => {
  const Component = appRegistry[name];
  
  if (!Component) {
    return (
      <div className="bg-red-950 border border-red-800 text-red-400 p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg w-full min-h-[300px]">
        <h3 className="font-bold text-xl mb-2">Aplicación no encontrada</h3>
        <p className="text-red-300">No se encontró una aplicación local con el nombre: <span className="font-mono bg-red-900/50 px-2 py-1 rounded">"{name}"</span></p>
        <p className="text-sm mt-4 opacity-70">Asegúrate de que la aplicación esté registrada en AppRegistry.tsx</p>
      </div>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center shadow-lg w-full min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-cyan-400 font-bold">Cargando Simulación Interactiva...</p>
        </div>
      }
    >
      <div className="w-full bg-slate-950 rounded-2xl overflow-hidden relative" style={{ minHeight: '400px' }}>
         <Component onWin={onWin} onClose={onClose} />
      </div>
    </Suspense>
  );
};
