import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, updateCourse, Course, Resource, Block, Quiz, LessonPage } from '../lib/courses';
import { Loader2, Plus, Save, Trash2, ArrowLeft, Video, Image as ImageIcon, AlignLeft, Layout, FileQuestion, ArrowUp, ArrowDown, Bold, List, Type } from 'lucide-react';

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (val: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isReady) {
      editorRef.current.innerHTML = content || '';
      setIsReady(true);
    }
  }, [content, isReady]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const format = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 focus-within:border-cyan-500 transition-colors">
      <div className="flex items-center gap-1 p-2 bg-slate-800 border-b border-slate-700">
        <button onMouseDown={(e) => format(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors">H1</button>
        <button onMouseDown={(e) => format(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors">H2</button>
        <button onMouseDown={(e) => format(e, 'formatBlock', 'H3')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors">H3</button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>
        <button onMouseDown={(e) => format(e, 'bold')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'insertUnorderedList')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"><List className="w-4 h-4" /></button>
      </div>
      <div 
        ref={editorRef}
        className="p-4 min-h-[120px] text-slate-300 outline-none prose prose-invert max-w-none"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
      />
    </div>
  );
};

export default function ContentMaker() {
  const { courseId, moduleId, resourceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for editing
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [quiz, setQuiz] = useState<Quiz | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');

  const isAdmin = user?.email === 'naomi.urrea94@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    const loadData = async () => {
      if (!courseId || !moduleId || !resourceId) return;
      try {
        const c = await getCourseById(courseId);
        if (c) {
          setCourse(c);
          const m = c.modules.find(mod => mod.id === moduleId);
          const r = m?.resources.find(res => res.id === resourceId);
          if (r && r.type === 'lesson') {
            setResource(r);
            
            // Migrate from pages to blocks if necessary
            if (r.blocks) {
              setBlocks(r.blocks);
            } else if (r.pages && r.pages.length > 0) {
              const migratedBlocks: Block[] = [];
              r.pages.forEach((p: LessonPage) => {
                p.elements.forEach(el => {
                  if (el.type === 'text') migratedBlocks.push({ id: el.id, type: 'text', content: el.content });
                  else if (el.type === 'image') migratedBlocks.push({ id: el.id, type: 'image', url: el.content, zoom: false });
                  else if (el.type === 'video') migratedBlocks.push({ id: el.id, type: 'video', url: el.content });
                  else if (el.type === 'app') migratedBlocks.push({ id: el.id, type: 'app', url: el.content });
                });
              });
              setBlocks(migratedBlocks);
            } else {
              setBlocks([]);
            }
            
            setQuiz(r.quiz);
          } else {
            navigate(-1); // Not a lesson or not found
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, moduleId, resourceId, isAdmin, navigate]);

  const handleSave = async () => {
    if (!course || !courseId || !moduleId || !resourceId || !resource) return;
    setSaving(true);
    try {
      const updatedResource: Resource = {
        ...resource,
        blocks,
        quiz
      };

      const updatedModules = course.modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            resources: m.resources.map(r => r.id === resourceId ? updatedResource : r)
          };
        }
        return m;
      });

      await updateCourse(courseId, { modules: updatedModules });
      alert("Contenido guardado exitosamente");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      type,
      content: type === 'text' ? '' : undefined,
      url: type !== 'text' ? '' : undefined,
      zoom: type === 'image' ? false : undefined
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  // Quiz functions
  const initializeQuiz = () => setQuiz({ passingScore: 60, questions: [] });
  const addQuestion = () => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        { id: Date.now().toString(), type: 'math', text: 'Nueva Pregunta', options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'], correctOptionIndex: 0 }
      ]
    });
  };
  const updateQuestion = (qId: string, field: string, value: any) => {
    if (!quiz) return;
    const qs = quiz.questions.map(q => q.id === qId ? { ...q, [field]: value } : q);
    setQuiz({ ...quiz, questions: qs });
  };
  const updateOption = (qId: string, optIndex: number, value: string) => {
    if (!quiz) return;
    const qs = quiz.questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuiz({ ...quiz, questions: qs });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <input 
              type="text" 
              value={resource?.title || ''} 
              onChange={(e) => setResource(resource ? { ...resource, title: e.target.value } : null)}
              className="text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors w-full sm:w-auto"
              placeholder="Nombre de la Clase..."
            />
            <p className="text-sm text-cyan-400 font-medium">Visual Page Maker</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Clase
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[70vh] flex flex-col">
        
        {/* Fixed Toolbar */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'content' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Layout className="w-4 h-4 inline-block mr-2" />
              Lienzo de Contenido
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'quiz' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <FileQuestion className="w-4 h-4 inline-block mr-2" />
              Test de Nivel
            </button>
          </div>

          {activeTab === 'content' && (
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                <Type className="w-4 h-4" /> Texto
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors">
                <ImageIcon className="w-4 h-4" /> Imagen
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('video')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors">
                <Video className="w-4 h-4" /> Video
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('app')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors">
                <Layout className="w-4 h-4" /> App
              </button>
            </div>
          )}
        </div>

        {/* Editor Content Area */}
        <div className="p-8 flex-1 bg-[#0a0f1c]">
          {activeTab === 'content' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {blocks.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                  <Layout className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">El lienzo está vacío</h3>
                  <p className="text-slate-400">Utiliza la barra de herramientas superior para añadir bloques de contenido.</p>
                </div>
              )}

              {blocks.map((block, index) => (
                <div key={block.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                  
                  {/* Block Controls */}
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeBlock(block.id)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-slate-800 rounded-lg">
                      {block.type === 'text' && <Type className="w-4 h-4 text-cyan-400" />}
                      {block.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-400" />}
                      {block.type === 'video' && <Video className="w-4 h-4 text-red-400" />}
                      {block.type === 'app' && <Layout className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Bloque de {block.type}
                    </span>
                    
                    {/* Zoom Toggle for Images */}
                    {block.type === 'image' && (
                      <div className="ml-auto flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-xs font-bold text-slate-400">Modo Zoom Educativo</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={block.zoom || false} onChange={(e) => updateBlock(block.id, { zoom: e.target.checked })} />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Block Inputs */}
                  {block.type === 'text' && (
                    <RichTextEditor 
                      content={block.content || ''} 
                      onChange={(val) => updateBlock(block.id, { content: val })} 
                    />
                  )}

                  {block.type === 'image' && (
                    <input 
                      type="url"
                      value={block.url || ''}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="URL de la imagen (ej: https://raw.githubusercontent.com/...)"
                    />
                  )}

                  {block.type === 'video' && (
                    <input 
                      type="url"
                      value={block.url || ''}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="URL del video de YouTube o Manim"
                    />
                  )}

                  {block.type === 'app' && (
                    <input 
                      type="url"
                      value={block.url || ''}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="URL de tu simulador o app interactiva"
                    />
                  )}
                </div>
              ))}

              {blocks.length > 0 && (
                <div className="flex justify-center pt-8 pb-4">
                  <p className="text-slate-500 text-sm font-medium">Fin de la clase</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Quiz section remains mostly unchanged but styled to fit */}
              {!quiz ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                  <FileQuestion className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Evalúa el aprendizaje</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">Agrega un test final para que los estudiantes validen lo aprendido antes de avanzar.</p>
                  <button onClick={initializeQuiz} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                    Habilitar Test de Nivel
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-white">Configuración del Test</h2>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-400 font-bold">Porcentaje para aprobar:</label>
                      <input 
                        type="number" min="1" max="100" 
                        value={quiz.passingScore}
                        onChange={(e) => setQuiz({...quiz, passingScore: Number(e.target.value)})}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 text-center"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {quiz.questions.map((q, i) => (
                      <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group">
                        <button 
                          onClick={() => setQuiz({...quiz, questions: quiz.questions.filter(qu => qu.id !== q.id)})}
                          className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex gap-4 mb-4">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 font-bold shrink-0">{i + 1}</span>
                          <div className="flex-1 space-y-4">
                            <textarea 
                              value={q.text}
                              onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none min-h-[80px]"
                              placeholder="Escribe la pregunta aquí..."
                            />
                            
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-3">
                                  <input 
                                    type="radio" 
                                    name={`correct_${q.id}`}
                                    checked={q.correctOptionIndex === optIdx}
                                    onChange={() => updateQuestion(q.id, 'correctOptionIndex', optIdx)}
                                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                  />
                                  <input 
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                    className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors ${q.correctOptionIndex === optIdx ? 'border-emerald-500/50' : 'border-slate-800 focus:border-cyan-500/50'}`}
                                  />
                                </div>
                              ))}
                            </div>
                            
                            <div className="pt-2">
                              <select 
                                value={q.type}
                                onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                              >
                                <option value="math">Matemática</option>
                                <option value="knowledge">Conocimiento</option>
                                <option value="paes">Tipo PAES (Aplicación)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addQuestion}
                    className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-950/10 font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Agregar Pregunta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
