import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, Course, Resource, Block, LessonPage } from '../lib/courses';
import { getUserProgress, recordLessonResult, UserProgress } from '../lib/progress';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, XCircle, X, Maximize2, ChevronDown, FileQuestion, ChevronLeft, Menu, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';

import { LessonRenderer, ZoomModal } from '../components/ui/LessonRenderer';



export default function LessonViewer() {
  const { courseId, moduleId, resourceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isCourseSidebarOpen, setIsCourseSidebarOpen] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Quiz state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number, passed: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !moduleId || !resourceId || !user) return;
      try {
        const c = await getCourseById(courseId);
        if (c) {
          setCourse(c);
          const m = c.modules.find(mod => mod.id === moduleId);
          const r = m?.resources.find(res => res.id === resourceId);
          if (r && r.type === 'lesson') {
            setResource(r);
            if (r.blocks && r.blocks.length > 0) {
              setBlocks(r.blocks);
            } else if (r.pages && r.pages.length > 0) {
              const migratedBlocks: Block[] = [];
              r.pages.forEach((p: LessonPage) => {
                p.elements.forEach(el => {
                  if (el.type === 'text') migratedBlocks.push({ id: el.id, type: 'text', content: el.content });
                  else if (el.type === 'image') migratedBlocks.push({ id: el.id, type: 'image', url: el.content, zoom: false });
                  else if (el.type === 'video') migratedBlocks.push({ id: el.id, type: 'video', url: el.content });
                  else if (el.type === 'app') migratedBlocks.push({ id: el.id, type: 'app', url: el.content });
                  else if (el.type === 'row') migratedBlocks.push({ id: el.id, type: 'row', columns: el.columns?.map(c => ({ id: c.id, blocks: c.elements.map(e => ({ id: e.id, type: e.type as any, content: e.content, url: e.content })) })) });
                });
              });
              setBlocks(migratedBlocks);
            }
          } else {
            navigate(-1);
          }
        }
        const p = await getUserProgress(user.uid);
        setProgress(p);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, moduleId, resourceId, user, navigate]);

  const handleFinishClass = () => {
    if (resource?.quiz && resource.quiz.questions.length > 0) {
      setShowQuiz(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  const handlePrevPage = () => {
    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinishClass();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!resource || !resource.quiz || !user) return;
    setIsSubmitting(true);
    
    const questions = resource.quiz.questions;
    let correctCount = 0;
    
    questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= resource.quiz.passingScore;

    setQuizResult({ score, passed });

    try {
      await recordLessonResult(user.uid, resource.id, score, passed);
      const p = await getUserProgress(user.uid);
      setProgress(p);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;
  }

  if (!resource) return null;

  const quiz = resource.quiz;
  const isCompleted = progress?.completedLessons.includes(resource.id);
  const bestScore = progress?.lessonScores[resource.id];

  const pages: Block[][] = [];
  let currentBlocks: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'page-break') {
      pages.push(currentBlocks);
      currentBlocks = [];
    } else {
      currentBlocks.push(block);
    }
  }
  pages.push(currentBlocks);
  const currentBlocksToShow = pages[currentPageIndex] || [];

  return (
    <div className="flex w-full relative">
      {/* Course Sidebar Widget */}
      <AnimatePresence>
        {isCourseSidebarOpen && course && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:block shrink-0 bg-slate-900 border-r border-slate-800 sticky top-0 h-screen overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-slate-200 truncate">Índice del Curso</h3>
              <button onClick={() => setIsCourseSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors" title="Cerrar índice">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {course.modules.map(module => (
                <div key={module.id} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{module.title}</h4>
                  <div className="space-y-1">
                    {module.resources.map(res => (
                      <button
                        key={res.id}
                        onClick={() => {
                          navigate(`/course/${courseId}/lesson/${module.id}/${res.id}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${res.id === resourceId ? 'bg-cyan-900/30 text-cyan-400 font-bold border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                      >
                        {res.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 sm:px-8 mx-auto pb-24 max-w-5xl overflow-hidden">
        {zoomImage && <ZoomModal url={zoomImage} onClose={() => setZoomImage(null)} />}

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg sticky top-4 z-40 mt-4">
          <div className="flex items-center gap-3">
            {!isCourseSidebarOpen && course && (
              <button 
                onClick={() => setIsCourseSidebarOpen(true)} 
                className="hidden lg:flex p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700" 
                title="Ver Índice"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => navigate(`/course/${courseId}`)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
            </button>
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{resource.title}</h1>
          </div>
          <div className="w-24 text-right">
            {isCompleted && <span className="text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded">Nivel Aprobado</span>}
          </div>
        </div>

      {/* Content Area */}
      {!showQuiz ? (
        <div className="bg-slate-900/50 p-6 sm:p-12 rounded-3xl border border-slate-800/50 shadow-2xl min-h-[60vh]">
          <div className="space-y-4">
            {currentBlocksToShow.map(block => <LessonRenderer key={block.id} block={block} onZoom={setZoomImage} />)}
            {currentBlocksToShow.length === 0 && blocks.length === 0 && (
              <div className="text-center py-20 text-slate-500">Esta clase no tiene contenido.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-6 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-w-3xl mx-auto">
          {!quizResult ? (
            <div className="space-y-10">
              <div className="text-center">
                <h2 className="text-3xl font-display font-bold text-white mb-2">Test de Nivel</h2>
                <p className="text-slate-400">Demuestra lo que has aprendido. Necesitas un {quiz?.passingScore}% para aprobar.</p>
                {bestScore !== undefined && (
                  <p className="text-sm text-cyan-400 mt-2">Tu mejor puntaje anterior: {bestScore}%</p>
                )}
              </div>

              <div className="space-y-8">
                {quiz?.questions.map((q, i) => (
                  <div key={q.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <span className="w-8 h-8 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <div className="space-y-4 w-full">
                        <p className="text-white font-medium text-lg leading-relaxed">{q.text}</p>
                        <div className="space-y-3">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === optIdx ? 'bg-cyan-900/20 border-cyan-500/50 shadow-lg shadow-cyan-900/20' : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                              <input 
                                type="radio" 
                                name={`q_${q.id}`} 
                                checked={answers[q.id] === optIdx}
                                onChange={() => setAnswers({...answers, [q.id]: optIdx})}
                                className="w-5 h-5 accent-cyan-500"
                              />
                              <span className="text-slate-300 font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-8 border-t border-slate-800">
                <button 
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || Object.keys(answers).length !== quiz?.questions.length}
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 shadow-xl shadow-cyan-900/20 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Entregar y Ver Resultados
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-6 animate-in zoom-in duration-500">
              {quizResult.passed ? (
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
              )}
              
              <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2">
                  {quizResult.passed ? '¡Nivel Aprobado!' : 'No has pasado el nivel'}
                </h2>
                <p className="text-slate-400 text-lg">Tu puntaje: <span className={`font-bold ${quizResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>{quizResult.score}%</span> (Requerido: {quiz?.passingScore}%)</p>
              </div>

              <div className="pt-8">
                {quizResult.passed ? (
                  <button onClick={() => navigate(`/course/${courseId}`)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 w-full sm:w-auto">
                    Continuar al siguiente contenido
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => { setQuizResult(null); setAnswers({}); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20">
                      Reintentar Test
                    </button>
                    <button onClick={() => { setShowQuiz(false); setQuizResult(null); }} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold transition-all border border-slate-700">
                      Repasar Contenido
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Controls */}
      {!quizResult && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4 z-40">
          <div className="w-full px-4 sm:px-8 mx-auto flex items-center justify-between">
            <button 
              onClick={handlePrevPage}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold px-4 py-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Anterior
            </button>
            
            {!showQuiz && blocks.length > 0 && (
              <button 
                onClick={handleNextPage}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-900/30 transition-all"
              >
                {currentPageIndex < pages.length - 1 ? 'Siguiente Página' : (resource.quiz && resource.quiz.questions.length > 0 ? 'Ir al Test de Nivel' : 'Finalizar Clase')} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showScrollTop && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-8 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-full shadow-xl shadow-cyan-900/30 transition-colors z-40 hidden lg:flex items-center justify-center group"
            title="Volver Arriba"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
