import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCoursesByCategory, createCourse, Course } from '../lib/courses';
import { Loader2, Plus, Book, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_NAMES = {
  escolar: 'Matemática Escolar',
  universitaria: 'Matemática Universitaria'
};

export default function CategoryView() {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Nuevo curso form
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === 'naomi.urrea94@gmail.com';
  const categoryTitle = CATEGORY_NAMES[categoryId as keyof typeof CATEGORY_NAMES] || 'Cursos';

  const loadCourses = async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const data = await getCoursesByCategory(categoryId);
      setCourses(data.sort((a, b) => a.createdAt - b.createdAt));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [categoryId]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !newTitle) return;
    
    setIsSubmitting(true);
    try {
      await createCourse({
        title: newTitle,
        category: categoryId as 'escolar' | 'universitaria',
        imageUrl: newImage || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
        description: 'Curso de ' + newTitle
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewImage('');
      loadCourses();
    } catch (error) {
      console.error("Error creating course", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">{categoryTitle}</h1>
          <p className="text-slate-400">Selecciona un curso para ver sus módulos y recursos.</p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/40"
          >
            <Plus className="w-5 h-5" />
            Agregar Curso
          </button>
        )}
      </div>

      {/* Grid de Cursos */}
      {courses.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
          <Book className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">No hay cursos disponibles aún</h3>
          <p className="text-slate-500">
            {isAdmin ? 'Haz clic en "Agregar Curso" para crear el primero.' : 'Pronto agregaremos nuevo contenido.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-900/20 transition-all group"
            >
              <div 
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${course.imageUrl})` }}
              >
                <div className="w-full h-full bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {course.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal para Crear Curso */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Nuevo Curso</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Título del curso</label>
                  <input
                    type="text" required autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                    placeholder="Ej. Álgebra Lineal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">URL de la Imagen (Opcional)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 text-white transition-all py-3 rounded-xl font-bold"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Curso'}
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
