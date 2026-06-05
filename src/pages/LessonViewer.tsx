import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, Course, Resource, Block, LessonPage } from '../lib/courses';
import { getUserProgress, recordLessonResult, UserProgress } from '../lib/progress';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, XCircle, X, Maximize2, ChevronDown, FileQuestion } from 'lucide-react';
import 'katex/dist/katex.min.css';

const ZoomModal = ({ url, onClose }: { url: string, onClose: () => void }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-red-500/80 p-2 rounded-full transition-all"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <img 
        src={url} 
        alt="Zoom" 
        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
};

const InteractiveChallenge: React.FC<{ block: Block }> = ({ block }) => {
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div className="my-6 border-2 border-emerald-600 rounded-2xl overflow-hidden shadow-lg bg-emerald-950/20">
      <div className="bg-emerald-600 text-white px-6 py-3 font-display font-bold text-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" /> Desafío Matemático
      </div>
      <div className="p-6 prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: block.content || '' }} />
      {block.solution && (
        <div className="px-6 pb-6">
          <button 
            onClick={() => setShowSolution(!showSolution)}
            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-4 py-2 rounded-lg font-bold transition-colors w-full sm:w-auto border border-emerald-800"
          >
            {showSolution ? 'Ocultar Desarrollo' : 'Ver Desarrollo Paso a Paso'}
          </button>
          {showSolution && (
            <div className="mt-4 p-6 bg-emerald-900/40 rounded-xl border border-emerald-800 prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: block.solution }} />
          )}
        </div>
      )}
    </div>
  );
};

const InteractiveTabs: React.FC<{ block: Block }> = ({ block }) => {
  const [activeTab, setActiveTab] = useState(0);
  if (!block.tabsContent || block.tabsContent.length === 0) return null;
  return (
    <div className="my-6 border border-slate-700 rounded-2xl overflow-hidden shadow-lg bg-slate-900">
      <div className="flex overflow-x-auto border-b border-slate-700 bg-slate-950 no-scrollbar">
        {block.tabsContent.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(idx)}
            className={`px-6 py-4 font-bold whitespace-nowrap transition-colors ${activeTab === idx ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="p-6 prose prose-invert prose-cyan max-w-none bg-slate-900">
        <div dangerouslySetInnerHTML={{ __html: block.tabsContent[activeTab].content }} />
      </div>
    </div>
  );
};

const InteractiveAccordion: React.FC<{ block: Block }> = ({ block }) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleItem = (id: string) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));

  if (!block.accordionItems || block.accordionItems.length === 0) return null;
  return (
    <div className="my-6 space-y-3">
      {block.accordionItems.map(item => (
        <div key={item.id} className="border border-slate-700 rounded-xl overflow-hidden shadow-md bg-slate-900">
          <button 
            onClick={() => toggleItem(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {item.title}
            <ChevronDown className={`w-5 h-5 transition-transform ${openItems[item.id] ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
          </button>
          {openItems[item.id] && (
            <div className="p-6 border-t border-slate-800 prose prose-invert prose-cyan max-w-none bg-slate-950/50" dangerouslySetInnerHTML={{ __html: item.content }} />
          )}
        </div>
      ))}
    </div>
  );
};

const InlineQuizBlock: React.FC<{ block: Block }> = ({ block }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  if (!block.quizData) return null;
  const isCorrect = selected === block.quizData.correctIndex;

  return (
    <div className="my-6 border-2 border-slate-700 rounded-2xl p-6 bg-slate-900 shadow-lg">
      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <FileQuestion className="w-6 h-6 text-yellow-400" /> {block.quizData.question}
      </h4>
      <div className="space-y-3">
        {block.quizData.options.map((opt, idx) => {
          let btnClass = "w-full text-left px-5 py-4 rounded-xl border transition-all ";
          if (!isSubmitted) {
            btnClass += selected === idx ? "bg-cyan-900/40 border-cyan-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700";
          } else {
            if (idx === block.quizData!.correctIndex) {
              btnClass += "bg-emerald-900/40 border-emerald-500 text-white";
            } else if (selected === idx && !isCorrect) {
              btnClass += "bg-red-900/40 border-red-500 text-white";
            } else {
              btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed";
            }
          }

          return (
            <button 
              key={idx}
              disabled={isSubmitted}
              onClick={() => setSelected(idx)}
              className={btnClass}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {isSubmitted && idx === block.quizData!.correctIndex && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isSubmitted && selected === idx && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>
      {!isSubmitted && selected !== null && (
        <button 
          onClick={() => setIsSubmitted(true)}
          className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg"
        >
          Comprobar Respuesta
        </button>
      )}
      {isSubmitted && (
        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-bold ${isCorrect ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
          {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          {isCorrect ? '¡Correcto! Excelente trabajo.' : 'Incorrecto. Intenta repasar el contenido y vuelve a intentarlo.'}
        </div>
      )}
    </div>
  );
};

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

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  const renderBlock = (block: Block) => {
    if (block.type === 'row') {
      return (
        <div key={block.id} className="flex flex-col md:flex-row gap-6 w-full my-6">
          {block.columns?.map(col => (
            <div key={col.id} className="flex-1 space-y-6">
              {col.blocks.map(subBlock => renderBlock(subBlock as Block))}
            </div>
          ))}
        </div>
      );
    }
    if (block.type === 'box') {
      const themes = {
        history: { header: 'bg-[#784d2f] text-white', body: 'bg-[#fbf4ea] border-[#784d2f] text-slate-900', prose: 'prose-slate' },
        situation: { header: 'bg-[#1b7330] text-white', body: 'bg-[#f0f8f2] border-[#1b7330] text-slate-900', prose: 'prose-slate' },
        formula: { header: 'bg-purple-700 text-white', body: 'bg-purple-50 border-purple-700 text-slate-900', prose: 'prose-slate' },
        exercise: { header: 'bg-teal-800 text-white', body: 'bg-teal-50 border-teal-800 text-slate-900', prose: 'prose-slate' },
        warning: { header: 'bg-red-700 text-white', body: 'bg-red-50 border-red-700 text-slate-900', prose: 'prose-slate' },
        theorem: { header: 'bg-cyan-900 text-cyan-50 border-l-8 border-cyan-500', body: 'bg-slate-900 border-l-8 border-cyan-500 text-slate-300', prose: 'prose-invert prose-cyan' },
        alert: { header: 'bg-orange-900 text-orange-50 border-l-8 border-orange-500', body: 'bg-slate-900 border-l-8 border-orange-500 text-slate-300', prose: 'prose-invert prose-orange' }
      };
      const theme = themes[block.theme as keyof typeof themes || 'history'];
      return (
        <div key={block.id} className={`my-6 rounded-2xl overflow-hidden border-2 ${theme.body} shadow-lg`}>
          {block.title && (
            <div className={`${theme.header} px-6 py-3 font-display font-bold text-lg`}>
              {block.title}
            </div>
          )}
          <div 
            className={`p-6 prose max-w-none ${theme.prose} prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl`}
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        </div>
      );
    }
    if (block.type === 'text') {
      return (
        <div 
          key={block.id} 
          className="prose prose-invert prose-cyan max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl text-slate-300 my-4"
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      );
    }
    if (block.type === 'image') {
      return (
        <div key={block.id} className="relative group mx-auto my-4 w-full">
          <img 
            src={block.url} 
            alt="" 
            className={`rounded-2xl w-full shadow-lg border border-slate-800 ${block.zoom ? 'cursor-zoom-in hover:border-cyan-500/50 transition-colors' : ''}`} 
            onClick={() => block.zoom && setZoomImage(block.url || '')}
          />
          {block.zoom && (
            <div className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Maximize2 className="w-5 h-5" />
            </div>
          )}
        </div>
      );
    }
    if (block.type === 'video') {
      return (
        <div key={block.id} className="my-8 w-full mx-auto max-w-5xl">
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black">
            <iframe 
              src={getEmbedUrl(block.url || '')} 
              className="w-full h-full border-0" 
              allowFullScreen 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>
          {block.caption && (
            <p className="text-center text-slate-400 text-sm mt-3 font-medium italic">
              {block.caption}
            </p>
          )}
        </div>
      );
    }
    
    if (block.type === 'app') {
      return (
        <div key={block.id} className="my-8 w-full mx-auto max-w-5xl">
          <div 
            className={`w-full bg-black border border-slate-800 ${block.rounded !== false ? 'rounded-2xl' : ''} ${block.shadow !== false ? 'shadow-2xl shadow-emerald-900/20' : ''} overflow-hidden`}
            style={{ height: `${block.height || 500}px` }}
          >
            <iframe 
              src={block.url || ''} 
              className="w-full h-full border-0" 
              allowFullScreen 
            ></iframe>
          </div>
        </div>
      );
    }

    if (block.type === 'challenge') return <InteractiveChallenge key={block.id} block={block} />;
    if (block.type === 'tabs') return <InteractiveTabs key={block.id} block={block} />;
    if (block.type === 'accordion') return <InteractiveAccordion key={block.id} block={block} />;
    if (block.type === 'inline-quiz') return <InlineQuizBlock key={block.id} block={block} />;
    return null;
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
    <div className="w-full px-4 sm:px-8 mx-auto pb-24">
      {zoomImage && <ZoomModal url={zoomImage} onClose={() => setZoomImage(null)} />}

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg sticky top-4 z-40">
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver al curso</span>
        </button>
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
            {currentBlocksToShow.map(block => renderBlock(block))}
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
    </div>
  );
}
