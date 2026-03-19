/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ExternalLink, Trash2, Globe, X, Search, LogIn, LogOut, Loader2, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  getDocs,
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { db, auth } from './lib/firebase';

interface WebApp {
  id: string;
  name: string;
  description: string;
  url: string;
  createdAt: number;
}

export default function App() {
  const [apps, setApps] = useState<WebApp[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', description: '', url: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLogingIn, setIsLogingIn] = useState(false);

  // Constants
  const ADMIN_EMAIL = 'naomi.urrea94@gmail.com'; 
  const isAdmin = user && user.email === ADMIN_EMAIL;

  // Función para cargar los datos desde Firestore (sin listener en tiempo real)
  const loadApps = useCallback(async () => {
    setDataLoading(true);
    try {
      const q = query(collection(db, 'web-apps'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const appData: WebApp[] = [];
      snapshot.forEach((docSnap) => {
        appData.push({ id: docSnap.id, ...docSnap.data() } as WebApp);
      });
      setApps(appData);
    } catch (err) {
      console.error('Error al cargar las páginas:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente (una sola vez)
  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Monitor Auth (independiente de los datos)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogingIn(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      setIsLoginOpen(false);
      setLoginForm({ email: '', password: '' });
    } catch (err: any) {
      setLoginError('Error al iniciar sesión. Verifica tus credenciales.');
      console.error(err);
    } finally {
      setIsLogingIn(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newApp.name || !newApp.url) return;

    let finalUrl = newApp.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      await addDoc(collection(db, 'web-apps'), {
        name: newApp.name,
        description: newApp.description,
        url: finalUrl,
        createdAt: Date.now(),
      });
      setNewApp({ name: '', description: '', url: '' });
      setIsModalOpen(false);
      await loadApps(); // Recargar la lista actualizada
    } catch (err) {
      console.error("Error adding document: ", err);
      alert("Error al guardar la página. Verifica tus permisos.");
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('¿Estás segura de que deseas eliminar esta aplicación?')) {
      try {
        await deleteDoc(doc(db, 'web-apps', id));
        await loadApps(); // Recargar la lista actualizada
      } catch (err) {
        console.error("Error deleting document: ", err);
        alert("No tienes permisos para eliminar esta página.");
      }
    }
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans bg-[#020617] text-slate-200 selection:bg-cyan-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-4 pb-8 border-b border-slate-800/50">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 mb-2"
          >
            Almacén Naomi
          </motion.h1>
          <p className="text-slate-400 font-medium">Recursos Educativos & Herramientas Web</p>
        </div>

        <div className="flex gap-3">
          {authLoading ? (
            <div className="flex items-center gap-2 px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl border border-slate-800 transition-all hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl border border-slate-800 transition-all hover:border-cyan-500/30"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">Admin</span>
            </button>
          )}
        </div>
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
            className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-xl"
          />
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-6 py-3.5 rounded-2xl font-medium transition-all shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/40 hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            Nueva Página
          </button>
        )}
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            <p className="text-slate-500 animate-pulse">Cargando aplicaciones...</p>
          </div>
        ) : apps.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 border-2 border-dashed border-slate-800/60 rounded-3xl bg-slate-900/20 backdrop-blur-sm"
          >
            <Globe className="w-16 h-16 mx-auto text-slate-700 mb-5" />
            <h2 className="text-2xl font-display text-slate-300 mb-3">Aún no hay aplicaciones</h2>
            <p className="text-slate-500 max-w-md mx-auto text-lg px-6">
              Esta es una galería privada gestionada por la Profe Naomi.
            </p>
          </motion.div>
        ) : filteredApps.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 border-2 border-dashed border-slate-800/60 rounded-3xl bg-slate-900/20 backdrop-blur-sm"
          >
            <Search className="w-16 h-16 mx-auto text-slate-700 mb-5" />
            <h2 className="text-2xl font-display text-slate-300 mb-3">No se encontraron resultados</h2>
            <p className="text-slate-500 max-w-md mx-auto text-lg px-6">
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
                  className="group bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all flex flex-col shadow-xl hover:shadow-cyan-900/10"
                >
                  {/* Preview Image */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-80 pointer-events-none"></div>
                    
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="absolute top-2 right-2 p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 text-cyan-400 text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <LinkIcon className="w-3 h-3" />
                      {new URL(app.url).hostname}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-display font-bold text-lg text-slate-100 mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors" title={app.name}>
                      {app.name}
                    </h3>
                    {app.description ? (
                      <p className="text-slate-500 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed" title={app.description}>
                        {app.description}
                      </p>
                    ) : (
                      <div className="mb-4 flex-grow"></div>
                    )}
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-slate-800/50 hover:bg-cyan-500 hover:text-white border border-slate-700/50 hover:border-cyan-500 text-cyan-400 px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visitar Página
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setIsLoginOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/20 rotate-12">
                  <LogIn className="w-8 h-8 text-white -rotate-12" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Administración</h2>
                <p className="text-slate-500 text-sm mt-1">Acceso restringido para el propietario</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs text-center">
                    {loginError}
                  </div>
                )}
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLogingIn}
                  className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-cyan-400 transition-all py-3.5 rounded-2xl font-bold mt-2 border-0 shadow-lg"
                >
                  {isLogingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLoginOpen(false)}
                  className="w-full text-slate-500 hover:text-slate-300 transition-colors py-2 text-xs font-medium"
                >
                  Cerrar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && isAdmin && (
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
              className="relative bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-cyan-400" />
                  </div>
                  Nueva Página
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddApp} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    Título
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={newApp.name}
                    onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                    placeholder="Simulación Interactiva"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="url" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    URL de la página
                  </label>
                  <input
                    id="url"
                    type="url"
                    required
                    value={newApp.url}
                    onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
                    placeholder="https://pagina.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={newApp.description}
                    onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all resize-none h-24"
                    placeholder="¿De qué trata esta herramienta?"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3.5 rounded-2xl font-semibold text-slate-400 bg-slate-800/50 hover:bg-slate-800 transition-all"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition-all shadow-lg active:scale-95"
                  >
                    Publicar
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
