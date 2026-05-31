import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, Course, Resource } from '../lib/courses';
import { getUserProgress, recordLessonResult, UserProgress } from '../lib/progress';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function LessonViewer() {
  const { courseId, moduleId, resourceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  
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

  const handleNextPage = () => {
    if (!resource || !resource.pages) return;
    if (currentPageIndex < resource.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (resource.quiz && resource.quiz.questions.length > 0) {
      setShowQuiz(true);
    } else {
      // No quiz, mark as read/done if needed
      navigate(`/course/${courseId}`);
    }
  };

  const handlePrevPage = () => {
    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else {
      navigate(`/course/${courseId}`);
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
      // Refresh progress
      const p = await getUserProgress(user.uid);
      setProgress(p);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;
  }

  if (!resource || !resource.pages) return null;

  const pages = resource.pages;
  const quiz = resource.quiz;
  const isCompleted = progress?.completedLessons.includes(resource.id);
  const bestScore = progress?.lessonScores[resource.id];

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> Volver al curso
        </button>
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-white">{resource.title}</h1>
          <p className="text-xs text-slate-500">
            {showQuiz ? 'Test de Nivel' : `Página ${currentPageIndex + 1} de ${pages.length}`}
          </p>
        </div>
        <div className="w-24 text-right">
          {isCompleted && <span className="text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded">Nivel Aprobado</span>}
        </div>
      </div>

      {/* Content Area */}
      {!showQuiz ? (
        <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl min-h-[60vh]">
          <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">{pages[currentPageIndex].title}</h2>
          
          <div className="space-y-8">
            {pages[currentPageIndex].elements.map(el => {
              const renderElement = (element: any) => {
                if (element.type === 'row') {
                  return (
                    <div key={element.id} className="flex flex-col md:flex-row gap-6 w-full">
                      {element.columns?.map((col: any) => (
                        <div key={col.id} className="flex-1 space-y-6">
                          {col.elements.map((subEl: any) => renderElement(subEl))}
                        </div>
                      ))}
                    </div>
                  );
                }
                if (element.type === 'text') {
                  return <div key={element.id} className="text-slate-300 leading-relaxed whitespace-pre-wrap">{element.content}</div>;
                }
                if (element.type === 'image') {
                  return <img key={element.id} src={element.content} alt="" className="rounded-xl w-full max-w-2xl mx-auto shadow-lg" />;
                }
                if (element.type === 'video' || element.type === 'app') {
                  return (
                    <div key={element.id} className="aspect-video w-full mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-black">
                      <iframe 
                        src={getEmbedUrl(element.content)} 
                        className="w-full h-full" 
                        allowFullScreen 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    </div>
                  );
                }
                if (element.type === 'gadget') {
                  if (element.content === 'calculator') {
                    return (
                      <div key={element.id} className="bg-slate-800 p-6 rounded-2xl max-w-xs mx-auto text-center border border-slate-700">
                        <p className="text-slate-400 mb-2 font-bold text-sm">Calculadora Básica</p>
                        <div className="bg-slate-900 p-4 rounded-xl text-right text-2xl font-mono text-white mb-4">0</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                            <button key={btn} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg font-bold">{btn}</button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              };
              
              return renderElement(el);
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl">
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
                  <div key={q.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <div className="flex gap-4">
                      <span className="w-8 h-8 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <div className="space-y-4 w-full">
                        <p className="text-white font-medium text-lg leading-relaxed">{q.text}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === optIdx ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                              <input 
                                type="radio" 
                                name={`q_${q.id}`} 
                                checked={answers[q.id] === optIdx}
                                onChange={() => setAnswers({...answers, [q.id]: optIdx})}
                                className="w-5 h-5 accent-cyan-500"
                              />
                              <span className="text-slate-300">{opt}</span>
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
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 shadow-xl shadow-cyan-900/20 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Entregar y Ver Resultados
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-6">
              {quizResult.passed ? (
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
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
                  <button onClick={() => navigate(`/course/${courseId}`)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all">
                    Continuar al siguiente contenido
                  </button>
                ) : (
                  <div className="space-x-4">
                    <button onClick={() => { setQuizResult(null); setAnswers({}); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all">
                      Reintentar Test
                    </button>
                    <button onClick={() => { setShowQuiz(false); setQuizResult(null); setCurrentPageIndex(0); }} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
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
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 p-4 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
              onClick={handlePrevPage}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold px-4 py-2"
            >
              <ArrowLeft className="w-5 h-5" /> Anterior
            </button>
            
            {!showQuiz && (
              <button 
                onClick={handleNextPage}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                {currentPageIndex === pages.length - 1 && resource.quiz && resource.quiz.questions.length > 0 ? 'Ir al Test de Nivel' : 'Siguiente Página'} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
