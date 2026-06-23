import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, GraduationCap, FileEdit, LayoutTemplate } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Verificamos si el usuario actual es la administradora
  const isAdmin = user?.email === 'naomi.urrea94@gmail.com';

  const categories = [
    {
      id: 'escolar',
      title: 'Matemática Escolar',
      description: 'Números, Álgebra, Geometría y Estadística',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'universitaria',
      title: 'Matemática Universitaria',
      description: 'Cálculo, Álgebra Lineal, Probabilidad y Estadística, Geometría',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Mensaje de Bienvenida Filosófico */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-8 sm:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-emerald-400"></div>
        <h1 className="text-3xl font-display font-bold text-white mb-6">
          Bienvenidos a mi Aula Virtual
        </h1>
        <div className="space-y-4 text-slate-300 leading-relaxed text-sm sm:text-base">
          <p>
            He creado este espacio con un objetivo claro: que tengas acceso a todo el conocimiento necesario para tu formación, desde la preparación PAES hasta cursos avanzados de Cálculo.
          </p>
          <p>
            Aquí no solo venimos a memorizar fórmulas, venimos a entender. Mi meta es que, a través de la disciplina y la reflexión, le agarres el gusto a la matemática y descubras que la lógica es mucho más sencilla de lo que parece.
          </p>
          <p>
            Este sitio es tu herramienta. Úsala para practicar, para equivocarte y para aprender, pero sobre todo, para que te des cuenta de que eres totalmente capaz de lograr tus objetivos académicos.
          </p>
          <p className="font-bold text-cyan-400 text-lg mt-4">
            ¡Explora los cursos y comencemos a estudiar!
          </p>
        </div>
      </motion.div>

      {/* Título de la sección */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">Cursos Disponibles</h2>
        
        {/* Aquí podríamos poner un botón global en el futuro si lo requiere el admin */}
      </div>

      {/* Tarjetas de Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(`/category/${cat.id}`)}
            className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-xl border border-slate-800 hover:border-slate-600 transition-all"
          >
            {/* Imagen de fondo */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${cat.image})` }}
            ></div>
            
            {/* Overlay oscuro y gradiente */}
            <div className="absolute inset-0 bg-slate-950/60 group-hover:bg-slate-950/40 transition-colors duration-500"></div>
            <div className={`absolute inset-0 opacity-40 bg-gradient-to-tr ${cat.color} mix-blend-overlay`}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            
            {/* Contenido */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-6 shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300`}>
                <cat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-3">
                {cat.title}
              </h3>
              <p className="text-slate-300 text-sm md:text-base font-medium">
                {cat.description}
              </p>
              
              {/* Fake button for UX */}
              <div className="mt-6 flex items-center text-cyan-400 text-sm font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Explorar categoría <span className="ml-2">→</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Herramientas Interactivas */}
      <div className="mt-12">
        <h2 className="text-2xl font-display font-bold text-white mb-6">Herramientas Interactivas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/creador-ensayos')}
            className="bg-slate-800 border border-slate-700 hover:border-sky-500/50 rounded-2xl p-6 cursor-pointer flex items-start space-x-4 transition-colors shadow-lg"
          >
            <div className="bg-sky-500/20 p-3 rounded-xl shrink-0">
              <FileEdit className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Creador de Ensayos</h3>
              <p className="text-sm text-slate-400">Entorno distraction-free para redactar documentos con notas y bibliografía integrada.</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/creador-dosier')}
            className="bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer flex items-start space-x-4 transition-colors shadow-lg"
          >
            <div className="bg-emerald-500/20 p-3 rounded-xl shrink-0">
              <LayoutTemplate className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Creador de Dosier</h3>
              <p className="text-sm text-slate-400">Lienzo drag & drop para armar material educativo visual e interactivo de forma modular.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
