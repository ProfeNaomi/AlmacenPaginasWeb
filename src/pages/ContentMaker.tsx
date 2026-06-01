import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, updateCourse, Course, Resource, LessonPage, LessonElement, Quiz } from '../lib/courses';
import { Loader2, Plus, Save, Trash2, ArrowLeft, Video, Image as ImageIcon, AlignLeft, Layout, Settings, FileQuestion, Columns, X } from 'lucide-react';

export default function ContentMaker() {
  const { courseId, moduleId, resourceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for editing
  const [pages, setPages] = useState<LessonPage[]>([]);
  const [quiz, setQuiz] = useState<Quiz | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'pages' | 'quiz'>('pages');
  const [activePageIndex, setActivePageIndex] = useState(0);

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
            setPages(r.pages || [{ id: Date.now().toString(), title: 'Página 1', elements: [] }]);
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
        pages,
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

  const addPage = () => {
    setPages([...pages, { id: Date.now().toString(), title: `Página ${pages.length + 1}`, elements: [] }]);
    setActivePageIndex(pages.length);
  };

  const removePage = (index: number) => {
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
    if (activePageIndex >= newPages.length) {
      setActivePageIndex(Math.max(0, newPages.length - 1));
    }
  };

  const updatePageTitle = (title: string) => {
    const newPages = [...pages];
    newPages[activePageIndex].title = title;
    setPages(newPages);
  };

  const addElement = (type: LessonElement['type'], columnId?: string, rowId?: string) => {
    setPages(prevPages => prevPages.map((page, index) => {
      if (index !== activePageIndex) return page;
      
      const newElements = [...(page.elements || [])];
      const newElement: LessonElement = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        type,
        content: type === 'gadget' ? 'calculator' : '',
        columns: type === 'row' ? [
          { id: Date.now().toString() + '1', elements: [] },
          { id: Date.now().toString() + '2', elements: [] }
        ] : undefined
      };

      if (rowId && columnId) {
        const rowIndex = newElements.findIndex(e => e.id === rowId);
        if (rowIndex > -1) {
          const row = { ...newElements[rowIndex] };
          if (row.columns) {
            row.columns = row.columns.map(col => {
              if (col.id === columnId) {
                return { ...col, elements: [...col.elements, newElement] };
              }
              return col;
            });
            newElements[rowIndex] = row;
          }
        }
      } else {
        newElements.push(newElement);
      }
      return { ...page, elements: newElements };
    }));
  };

  const updateElement = (elementId: string, content: string, rowId?: string, columnId?: string) => {
    setPages(prevPages => prevPages.map((page, index) => {
      if (index !== activePageIndex) return page;
      const newElements = [...(page.elements || [])];

      if (rowId && columnId) {
        const rowIndex = newElements.findIndex(e => e.id === rowId);
        if (rowIndex > -1) {
          const row = { ...newElements[rowIndex] };
          if (row.columns) {
            row.columns = row.columns.map(col => {
              if (col.id === columnId) {
                return { ...col, elements: col.elements.map(e => e.id === elementId ? { ...e, content } : e) };
              }
              return col;
            });
            newElements[rowIndex] = row;
          }
        }
      } else {
        const elementIndex = newElements.findIndex(e => e.id === elementId);
        if (elementIndex > -1) {
          newElements[elementIndex] = { ...newElements[elementIndex], content };
        }
      }
      return { ...page, elements: newElements };
    }));
  };

  const removeElement = (elementId: string, rowId?: string, columnId?: string) => {
    setPages(prevPages => prevPages.map((page, index) => {
      if (index !== activePageIndex) return page;
      let newElements = [...(page.elements || [])];

      if (rowId && columnId) {
        const rowIndex = newElements.findIndex(e => e.id === rowId);
        if (rowIndex > -1) {
          const row = { ...newElements[rowIndex] };
          if (row.columns) {
            row.columns = row.columns.map(col => {
              if (col.id === columnId) {
                return { ...col, elements: col.elements.filter(e => e.id !== elementId) };
              }
              return col;
            });
            newElements[rowIndex] = row;
          }
        }
      } else {
        newElements = newElements.filter(e => e.id !== elementId);
      }
      return { ...page, elements: newElements };
    }));
  };

  const addColumnToRow = (rowId: string) => {
    setPages(prevPages => prevPages.map((page, index) => {
      if (index !== activePageIndex) return page;
      const newElements = [...(page.elements || [])];
      const rowIndex = newElements.findIndex(e => e.id === rowId);
      if (rowIndex > -1) {
        const row = { ...newElements[rowIndex] };
        if (row.columns && row.columns.length < 4) {
          row.columns = [...row.columns, { id: Date.now().toString() + Math.random().toString(36).substring(2, 6), elements: [] }];
          newElements[rowIndex] = row;
        }
      }
      return { ...page, elements: newElements };
    }));
  };

  const removeColumnFromRow = (rowId: string, columnId: string) => {
    setPages(prevPages => prevPages.map((page, index) => {
      if (index !== activePageIndex) return page;
      const newElements = [...(page.elements || [])];
      const rowIndex = newElements.findIndex(e => e.id === rowId);
      if (rowIndex > -1) {
        const row = { ...newElements[rowIndex] };
        if (row.columns && row.columns.length > 1) {
          row.columns = row.columns.filter(c => c.id !== columnId);
          newElements[rowIndex] = row;
        }
      }
      return { ...page, elements: newElements };
    }));
  };

  // Quiz functions
  const initializeQuiz = () => {
    setQuiz({ passingScore: 60, questions: [] });
  };

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
    const qs = [...quiz.questions];
    const qIndex = qs.findIndex(q => q.id === qId);
    if (qIndex > -1) {
      (qs[qIndex] as any)[field] = value;
      setQuiz({ ...quiz, questions: qs });
    }
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
    if (!quiz) return;
    const qs = [...quiz.questions];
    const q = qs.find(q => q.id === qId);
    if (q) {
      q.options[optIndex] = value;
      setQuiz({ ...quiz, questions: qs });
    }
  };

  const renderElementEditor = (el: LessonElement, rowId?: string, columnId?: string) => (
    <div key={el.id} className="relative group bg-slate-950 border border-slate-800 rounded-xl p-4">
      <button 
        onClick={() => removeElement(el.id, rowId, columnId)}
        className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
        {el.type === 'text' && <><AlignLeft className="w-3 h-3" /> Texto</>}
        {el.type === 'video' && <><Video className="w-3 h-3" /> Video YouTube (URL)</>}
        {el.type === 'image' && <><ImageIcon className="w-3 h-3" /> Imagen (URL)</>}
        {el.type === 'app' && <><Layout className="w-3 h-3" /> App/Iframe Externa (URL)</>}
        {el.type === 'gadget' && <><Settings className="w-3 h-3" /> Herramienta Interactiva</>}
      </div>

      {el.type === 'text' ? (
        <textarea 
          value={el.content}
          onChange={(e) => updateElement(el.id, e.target.value, rowId, columnId)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 min-h-[120px]"
          placeholder="Escribe el contenido aquí... (Soporta Markdown simple o HTML básico si lo implementas)"
        />
      ) : el.type === 'gadget' ? (
        <select 
          value={el.content}
          onChange={(e) => updateElement(el.id, e.target.value, rowId, columnId)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none"
        >
          <option value="calculator">Calculadora Estándar</option>
          <option value="timer">Cronómetro / Temporizador</option>
        </select>
      ) : (
        <input 
          type="url"
          value={el.content}
          onChange={(e) => updateElement(el.id, e.target.value, rowId, columnId)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
          placeholder="https://..."
        />
      )}
    </div>
  );

  // Removed renderAddElementBar as we are using drag and drop now.

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800">
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
              placeholder="Título de la clase..."
            />
            <p className="text-sm text-slate-400">Edición de Clase Interactiva</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4 h-fit">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('pages')}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'pages' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <AlignLeft className="w-4 h-4 inline-block mr-2" />
              Páginas de Contenido
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'quiz' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <FileQuestion className="w-4 h-4 inline-block mr-2" />
              Test de Nivel
            </button>
          </div>

          {activeTab === 'pages' && (
            <>
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Herramientas</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div draggable onDragStart={(e) => e.dataTransfer.setData('elementType', 'text')} className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 border border-slate-700 bg-slate-800 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-500 transition-all text-xs font-bold gap-2">
                    <AlignLeft className="w-5 h-5" /> Texto
                  </div>
                  <div draggable onDragStart={(e) => e.dataTransfer.setData('elementType', 'video')} className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 border border-slate-700 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:border-red-500 transition-all text-xs font-bold gap-2">
                    <Video className="w-5 h-5" /> Video
                  </div>
                  <div draggable onDragStart={(e) => e.dataTransfer.setData('elementType', 'image')} className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 border border-slate-700 bg-slate-800 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500 transition-all text-xs font-bold gap-2">
                    <ImageIcon className="w-5 h-5" /> Imagen
                  </div>
                  <div draggable onDragStart={(e) => e.dataTransfer.setData('elementType', 'app')} className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 border border-slate-700 bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500 transition-all text-xs font-bold gap-2">
                    <Layout className="w-5 h-5" /> App/Iframe
                  </div>
                  <div draggable onDragStart={(e) => e.dataTransfer.setData('elementType', 'gadget')} className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 border border-slate-700 bg-slate-800 rounded-xl text-slate-400 hover:text-amber-400 hover:border-amber-500 transition-all text-xs font-bold gap-2">
                    <Settings className="w-5 h-5" /> Gadget
                  </div>
                  <div draggable onDragStart={(e) => e.dataTransfer.setData('elementType', 'row')} className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 border border-slate-700 bg-slate-800 rounded-xl text-slate-400 hover:text-purple-400 hover:border-purple-500 transition-all text-xs font-bold gap-2">
                    <Columns className="w-5 h-5" /> Fila
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-3">Arrastra las herramientas hacia el lienzo</p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Páginas</h3>
                <div className="space-y-2">
                  {pages.map((p, idx) => (
                    <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activePageIndex === idx ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-800/50'}`} onClick={() => setActivePageIndex(idx)}>
                      <span className="text-sm text-slate-300 truncate">{p.title || `Página ${idx + 1}`}</span>
                      {pages.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); removePage(idx); }} className="text-slate-500 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addPage} className="w-full flex items-center justify-center gap-2 py-2 mt-2 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors text-sm">
                    <Plus className="w-4 h-4" /> Nueva Página
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Editor Area */}
        <div className="md:col-span-3 bg-slate-900 p-6 rounded-2xl border border-slate-800 min-h-[500px]">
          {activeTab === 'pages' && pages[activePageIndex] && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Título de la Página</label>
                <input 
                  type="text" 
                  value={pages[activePageIndex].title} 
                  onChange={(e) => updatePageTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 mt-1"
                />
              </div>

              <div 
                className="space-y-4 min-h-[500px] border-2 border-dashed border-slate-700 rounded-2xl p-6 bg-slate-950 relative"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const type = e.dataTransfer.getData('elementType') as LessonElement['type'];
                  if (type) addElement(type);
                }}
              >
                {pages[activePageIndex].elements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                    <Layout className="w-12 h-12 mb-2 opacity-50" />
                    <p className="font-bold">El lienzo está vacío</p>
                    <p className="text-sm">Arrastra herramientas aquí para construir</p>
                  </div>
                )}

                {pages[activePageIndex].elements.map((el) => {
                  if (el.type === 'row') {
                    return (
                      <div key={el.id} className="relative group bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <button 
                          onClick={() => removeElement(el.id)}
                          className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Columns className="w-4 h-4" /> Fila (Cuadrícula)
                          </div>
                          {el.columns && el.columns.length < 4 && (
                            <button onClick={() => addColumnToRow(el.id)} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/30 px-3 py-1.5 rounded-md border border-cyan-800">
                              + Agregar Columna
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                          {el.columns?.map(col => (
                            <div 
                              key={col.id} 
                              className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg p-3 min-w-[200px] min-h-[150px] transition-colors flex flex-col"
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const type = e.dataTransfer.getData('elementType') as LessonElement['type'];
                                if (type) {
                                  if (type === 'row') alert("No puedes agregar una fila dentro de otra fila.");
                                  else addElement(type, col.id, el.id);
                                }
                              }}
                            >
                              <div className="flex justify-end mb-2">
                                {el.columns!.length > 1 && (
                                  <button onClick={() => removeColumnFromRow(el.id, col.id)} className="text-slate-500 hover:text-red-400 p-1">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="space-y-3 flex-1">
                                {col.elements.map(subEl => renderElementEditor(subEl, el.id, col.id))}
                                {col.elements.length === 0 && (
                                  <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold text-center pointer-events-none pb-4">
                                    Arrastra elemento aquí
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  return renderElementEditor(el);
                })}
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {!quiz ? (
                <div className="text-center py-20">
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
                        className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:border-cyan-500"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {quiz.questions.map((q, i) => (
                      <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative">
                        <button 
                          onClick={() => {
                            const qs = quiz.questions.filter(qu => qu.id !== q.id);
                            setQuiz({...quiz, questions: qs});
                          }}
                          className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        
                        <div className="flex gap-4 mb-4">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 font-bold">{i + 1}</span>
                          <div className="flex-1 space-y-4">
                            <textarea 
                              value={q.text}
                              onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none min-h-[80px]"
                              placeholder="Pregunta..."
                            />
                            
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-3">
                                  <input 
                                    type="radio" 
                                    name={`correct_${q.id}`}
                                    checked={q.correctOptionIndex === optIdx}
                                    onChange={() => updateQuestion(q.id, 'correctOptionIndex', optIdx)}
                                    className="w-4 h-4 accent-emerald-500"
                                  />
                                  <input 
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                    className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2 text-sm text-white focus:outline-none ${q.correctOptionIndex === optIdx ? 'border-emerald-500/50' : 'border-slate-800 focus:border-cyan-500/50'}`}
                                  />
                                </div>
                              ))}
                            </div>
                            
                            <div className="pt-2">
                              <select 
                                value={q.type}
                                onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
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
