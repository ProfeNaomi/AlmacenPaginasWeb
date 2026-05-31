import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, updateCourse, Course, CourseModule, Resource } from '../lib/courses';
import { Loader2, Plus, ChevronDown, ChevronRight, FileText, Link as LinkIcon, Video, AlignLeft, Layout, Settings, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CourseView() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Modals state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Form states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newResource, setNewResource] = useState<Partial<Resource>>({ type: 'pdf', title: '', url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === 'naomi.urrea94@gmail.com';

  const loadCourse = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await getCourseById(courseId);
      if (data) {
        setCourse(data);
        // Expand all modules by default
        const initialExpanded: Record<string, boolean> = {};
        data.modules.forEach(m => initialExpanded[m.id] = true);
        setExpandedModules(initialExpanded);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !courseId || !newModuleTitle) return;
    
    setIsSubmitting(true);
    const newModule: CourseModule = {
      id: Date.now().toString(),
      title: newModuleTitle,
      resources: []
    };
    
    const updatedModules = [...course.modules, newModule];
    
    try {
      await updateCourse(courseId, { modules: updatedModules });
      setCourse({ ...course, modules: updatedModules });
      setExpandedModules(prev => ({ ...prev, [newModule.id]: true }));
      setIsModuleModalOpen(false);
      setNewModuleTitle('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !courseId || !activeModuleId || !newResource.title) return;
    
    setIsSubmitting(true);
    const resource: Resource = {
      id: Date.now().toString(),
      title: newResource.title,
      type: newResource.type as any,
      url: newResource.url,
      content: newResource.content
    };
    
    const updatedModules = course.modules.map(m => {
      if (m.id === activeModuleId) {
        return { ...m, resources: [...m.resources, resource] };
      }
      return m;
    });
    
    try {
      await updateCourse(courseId, { modules: updatedModules });
      setCourse({ ...course, modules: updatedModules });
      setIsResourceModalOpen(false);
      setNewResource({ type: 'pdf', title: '', url: '' });
      setActiveModuleId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'video': return <Video className="w-5 h-5 text-purple-400" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-blue-400" />;
      case 'app': return <Layout className="w-5 h-5 text-emerald-400" />;
      default: return <AlignLeft className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-300">Curso no encontrado</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-cyan-400 hover:underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Course Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="h-32 sm:h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${course.imageUrl})` }}>
          <div className="absolute inset-0 bg-slate-950/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">{course.title}</h1>
            <p className="text-slate-300 max-w-2xl">{course.description}</p>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex justify-end">
          <button 
            onClick={() => setIsModuleModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" /> Agregar Sección
          </button>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <p className="text-slate-500">No hay contenido en este curso todavía.</p>
          </div>
        ) : (
          course.modules.map((module) => (
            <div key={module.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Module Header */}
              <div 
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedModules[module.id] ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                  <h3 className="text-lg font-bold text-slate-200">{module.title}</h3>
                </div>
                
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModuleId(module.id);
                      setIsResourceModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-cyan-900 text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700 hover:border-cyan-800"
                  >
                    <Plus className="w-3 h-3" /> Añadir recurso
                  </button>
                )}
              </div>

              {/* Resources List */}
              <AnimatePresence>
                {expandedModules[module.id] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-800"
                  >
                    <div className="p-2 space-y-1">
                      {module.resources.length === 0 ? (
                        <div className="px-10 py-4 text-sm text-slate-500 italic">
                          Sección vacía
                        </div>
                      ) : (
                        module.resources.map((resource) => (
                          <a 
                            key={resource.id}
                            href={resource.url || '#'}
                            target={resource.url ? "_blank" : "_self"}
                            rel="noreferrer"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 rounded-xl transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors">
                              {getResourceIcon(resource.type)}
                            </div>
                            <span className="text-slate-300 font-medium group-hover:text-cyan-400 transition-colors">
                              {resource.title}
                            </span>
                            {resource.type === 'pdf' && <span className="text-[10px] text-slate-500 ml-2 border border-slate-700 px-1.5 py-0.5 rounded">PDF</span>}
                          </a>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Module */}
      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModuleModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Nueva Sección</h2>
                <button onClick={() => setIsModuleModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddModule} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Título de la sección</label>
                  <input
                    type="text" required autoFocus
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                    placeholder="Ej. Límites y Continuidad"
                  />
                </div>
                <button
                  type="submit" disabled={isSubmitting || !newModuleTitle}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Crear Sección'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: New Resource */}
      <AnimatePresence>
        {isResourceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsResourceModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Nuevo Recurso</h2>
                <button onClick={() => setIsResourceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddResource} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tipo de recurso</label>
                  <select
                    value={newResource.type}
                    onChange={(e) => setNewResource({...newResource, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 text-sm appearance-none"
                  >
                    <option value="pdf">Documento PDF</option>
                    <option value="link">Enlace web</option>
                    <option value="video">Video</option>
                    <option value="app">Aplicación Interactiva (Ej. Pitágoras)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Título</label>
                  <input
                    type="text" required
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                    placeholder="Ej. Guía de ejercicios 1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">URL / Enlace</label>
                  <input
                    type="url" required
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                    placeholder="https://..."
                  />
                  <p className="text-[10px] text-slate-500 px-1 mt-1">Pega el link de Google Drive, YouTube o página web.</p>
                </div>

                <button
                  type="submit" disabled={isSubmitting || !newResource.title || !newResource.url}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Agregar Recurso'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
