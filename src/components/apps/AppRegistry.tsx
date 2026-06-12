import React, { Suspense, lazy } from 'react';

// Registro de Aplicaciones Interactivas Personalizadas
// Para agregar una nueva app, añádela a este registro usando lazy loading.
const appRegistry: Record<string, React.LazyExoticComponent<any>> = {
  'LimitsSimulation': lazy(() => import('./LimitsSimulation')),
};

export const CustomAppRenderer: React.FC<{ name: string }> = ({ name }) => {
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
      <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden relative" style={{ minHeight: '400px' }}>
         {/* Renderizamos el componente. Le damos fondo blanco y shadow para que resalte. */}
         <Component />
      </div>
    </Suspense>
  );
};
