import React, { useState, useEffect } from 'react';
import { defaultGameLevels, GameLevel, WORLD_NAMES, getWorldBackgrounds, setWorldBackground, getDirectImageUrl } from '../../lib/gameMap';
import { Map, Edit3, Settings, Plus, Layout, Type, Image as ImageIcon, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameMapBuilder() {
  const [levels, setLevels] = useState<GameLevel[]>(defaultGameLevels);
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  
  // State for Backgrounds Tab
  const [activeTab, setActiveTab] = useState<'levels' | 'backgrounds'>('levels');
  const [backgrounds, setBackgrounds] = useState<Record<number, string>>({});

  useEffect(() => {
    setBackgrounds(getWorldBackgrounds());
  }, []);

  const handleEditLevel = (lvl: GameLevel) => {
    setSelectedLevel(lvl);
  };

  const handleSaveLevel = () => {
    if (selectedLevel) {
      setLevels(levels.map(l => l.id === selectedLevel.id ? selectedLevel : l));
      setSelectedLevel(null);
    }
  };

  const handleBackgroundChange = (worldId: number, url: string) => {
    setBackgrounds(prev => ({...prev, [worldId]: url}));
  };

  const handleSaveBackgrounds = () => {
    Object.entries(backgrounds).forEach(([id, url]) => {
      setWorldBackground(parseInt(id), url as string);
    });
    alert('¡Fondos guardados correctamente!');
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Map className="w-8 h-8 text-cyan-400" />
            Creador de Desafíos
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Configura el mapa de juego. Asigna aplicaciones a los niveles y personaliza los fondos de cada mundo.
          </p>
        </div>
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('levels')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'levels' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Map className="w-4 h-4" /> Niveles
          </button>
          <button 
            onClick={() => setActiveTab('backgrounds')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'backgrounds' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <ImageIcon className="w-4 h-4" /> Fondos
          </button>
        </div>
      </header>

      {activeTab === 'levels' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Niveles */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[70vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Map className="w-5 h-5 text-slate-400" /> Ruta de Aprendizaje ({levels.length} Niveles)
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {levels.map((lvl) => (
                <div 
                  key={lvl.id} 
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${selectedLevel?.id === lvl.id ? 'bg-cyan-900/30 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                  onClick={() => handleEditLevel(lvl)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${lvl.type === 'app' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {lvl.number}
                    </div>
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {lvl.title}
                        {lvl.type === 'app' && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold"><Layout className="w-3 h-3 inline mr-1"/> App</span>}
                        {lvl.type === 'quiz' && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold"><Type className="w-3 h-3 inline mr-1"/> Quiz</span>}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">{lvl.description}</p>
                    </div>
                  </div>
                  
                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Editor de Nivel (Sidebar Derecho) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[70vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-white">Propiedades del Nivel</h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedLevel ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Número de Nivel</label>
                    <input type="number" disabled value={selectedLevel.number} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white opacity-50" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Título</label>
                    <input 
                      type="text" 
                      value={selectedLevel.title} 
                      onChange={e => setSelectedLevel({...selectedLevel, title: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-colors" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción / Instrucción</label>
                    <textarea 
                      value={selectedLevel.description} 
                      onChange={e => setSelectedLevel({...selectedLevel, description: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-colors h-24 resize-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Desafío</label>
                    <select 
                      value={selectedLevel.type}
                      onChange={e => setSelectedLevel({...selectedLevel, type: e.target.value as 'app'|'quiz'})}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                    >
                      <option value="app">Mini-Juego (React App)</option>
                      <option value="quiz">Pregunta PAES (Quiz)</option>
                    </select>
                  </div>

                  {selectedLevel.type === 'app' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Nombre del Componente (AppRegistry)</label>
                      <input 
                        type="text" 
                        value={selectedLevel.appComponentName || ''} 
                        onChange={e => setSelectedLevel({...selectedLevel, appComponentName: e.target.value})}
                        placeholder="Ej. PythagorasGame"
                        className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition-colors font-mono text-sm" 
                      />
                      <p className="text-xs text-slate-500">Este nombre debe coincidir exactamente con una entrada en <code className="text-cyan-400 bg-cyan-900/30 px-1 rounded">AppRegistry.tsx</code>.</p>
                    </motion.div>
                  )}

                  <div className="pt-6 border-t border-slate-800">
                    <button onClick={handleSaveLevel} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl transition-colors">
                      Guardar Nivel
                    </button>
                  </div>

                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <Edit3 className="w-12 h-12 mb-4 opacity-50" />
                  <p>Selecciona un nivel del mapa a la izquierda para editar sus propiedades y asignar un mini-juego.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Pestaña de Fondos de Mundos */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-cyan-400" /> Personalizador de Fondos
              </h2>
              <p className="text-slate-400 mt-1">
                Pega la URL (enlace) de la imagen que deseas usar para cada mundo. Las imágenes se estirarán al ancho completo y alto designado.
              </p>
            </div>
            <button onClick={handleSaveBackgrounds} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20">
              <Save className="w-5 h-5" />
              Guardar Todos los Fondos
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {WORLD_NAMES.map((name, index) => {
              const worldId = index + 1;
              return (
                <div key={worldId} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-indigo-500/20 text-indigo-400 font-bold px-2 py-1 rounded text-xs">Mundo {worldId}</span>
                    <span className="text-white font-bold truncate ml-2" title={name}>{name}</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">URL de Imagen</label>
                    <input 
                      type="text" 
                      placeholder="https://ejemplo.com/imagen.jpg" 
                      value={backgrounds[worldId] || ''}
                      onChange={(e) => handleBackgroundChange(worldId, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
                    />
                  </div>
                  {/* Vista previa pequeña */}
                  {backgrounds[worldId] && (
                     <div 
                       className="w-full h-24 rounded-lg mt-2 bg-cover bg-center border border-slate-700" 
                       style={{ backgroundImage: `url(${getDirectImageUrl(backgrounds[worldId])})` }}
                     />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
