/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Globe, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WebApp {
  id: string;
  name: string;
  description: string;
  url: string;
  createdAt: number;
}

export default function App() {
  const [apps, setApps] = useState<WebApp[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', description: '', url: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const storedApps = localStorage.getItem('profNaomiApps');
    if (storedApps) {
      try {
        setApps(JSON.parse(storedApps));
      } catch (e) {
        console.error("Error parsing stored apps", e);
      }
    }
  }, []);

  // Save to local storage whenever apps change
  useEffect(() => {
    localStorage.setItem('profNaomiApps', JSON.stringify(apps));
  }, [apps]);

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.name || !newApp.url) return;

    // Ensure URL has protocol
    let finalUrl = newApp.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const app: WebApp = {
      id: crypto.randomUUID(),
      name: newApp.name,
      description: newApp.description,
      url: finalUrl,
      createdAt: Date.now(),
    };

    setApps([app, ...apps]);
    setNewApp({ name: '', description: '', url: '' });
    setIsModalOpen(false);
  };

  const handleDeleteApp = (id: string) => {
    if (window.confirm('¿Estás segura de que deseas eliminar esta aplicación?')) {
      setApps(apps.filter(app => app.id !== id));
    }
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col items-center text-center pt-4 pb-8 border-b border-slate-800/50">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 mb-4"
        >
          Aplicaciones Web Prof Naomi
        </motion.h1>
      </header>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre o tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-xl"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-6 py-3.5 rounded-2xl font-medium transition-all shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/40 hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Nueva Página
        </button>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto">
        {apps.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 border-2 border-dashed border-slate-800/60 rounded-3xl bg-slate-900/30 backdrop-blur-sm"
          >
            <Globe className="w-16 h-16 mx-auto text-slate-600 mb-5" />
            <h2 className="text-2xl font-display text-slate-300 mb-3">Aún no hay aplicaciones</h2>
            <p className="text-slate-500 max-w-md mx-auto text-lg">
              Haz clic en "Nueva Página" para comenzar a agregar tus recursos de matemáticas, programación y ciencia.
            </p>
          </motion.div>
        ) : filteredApps.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 border-2 border-dashed border-slate-800/60 rounded-3xl bg-slate-900/30 backdrop-blur-sm"
          >
            <Search className="w-16 h-16 mx-auto text-slate-600 mb-5" />
            <h2 className="text-2xl font-display text-slate-300 mb-3">No se encontraron resultados</h2>
            <p className="text-slate-500 max-w-md mx-auto text-lg">
              No hay aplicaciones que coincidan con "{searchQuery}".
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredApps.map((app) => (
                <motion.div
                  layout
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-colors flex flex-col shadow-xl"
                >
                  {/* Preview Image (using iframe for live rendering) */}
                  <div className="relative h-40 bg-slate-950 border-b border-slate-800 overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 w-[400%] h-[400%] opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }}
                    >
                      <iframe
                        src={app.url}
                        title={`Vista previa de ${app.name}`}
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-scripts allow-same-origin"
                        tabIndex={-1}
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60 pointer-events-none"></div>
                    <button
                      onClick={() => handleDeleteApp(app.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-display font-bold text-lg text-slate-100 mb-2 line-clamp-1" title={app.name}>
                      {app.name}
                    </h3>
                    {app.description ? (
                      <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow" title={app.description}>
                        {app.description}
                      </p>
                    ) : (
                      <div className="mb-4 flex-grow"></div>
                    )}
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-lg font-mono text-xs transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visitar Sitio
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  Agregar Nueva Página
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddApp} className="p-6 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Nombre de la aplicación
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={newApp.name}
                    onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="Ej: Simulador de Física"
                  />
                </div>
                
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1.5">
                    URL (Enlace)
                  </label>
                  <input
                    id="url"
                    type="url"
                    required
                    value={newApp.url}
                    onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="https://ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    id="description"
                    value={newApp.description}
                    onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none h-24"
                    placeholder="Breve descripción de la utilidad de esta página..."
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition-all shadow-lg shadow-cyan-900/50"
                  >
                    Guardar Página
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
