import React, { useState, useEffect } from 'react';
import ChallengeMap from '../components/ChallengeMap/ChallengeMap';
import { defaultGameLevels, getGameProgress, getWorldBackgrounds, GameLevel } from '../lib/gameMap';

export default function MapTestPage() {
  const [progress, setProgress] = useState(getGameProgress());
  const [customBackgrounds, setCustomBackgrounds] = useState(getWorldBackgrounds());

  const handleLevelClick = (level: GameLevel) => {
    alert(`Clic en nivel: ${level.title} (Mundo ${level.worldId})`);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center z-50 shadow-md">
        <h1 className="text-xl font-bold text-white">Prueba del Mapa de Desafíos</h1>
        <button 
          onClick={() => {
            // Fake progress advance for testing
            setProgress(prev => ({
              ...prev,
              unlockedLevel: Math.min(200, prev.unlockedLevel + 1),
              completedLevels: [...prev.completedLevels, prev.unlockedLevel]
            }));
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          Avanzar Nivel
        </button>
      </div>
      <div className="flex-1 relative">
        <ChallengeMap 
          levels={defaultGameLevels}
          progress={progress}
          customBackgrounds={customBackgrounds}
          onLevelClick={handleLevelClick}
        />
      </div>
    </div>
  );
}
