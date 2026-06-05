import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, updateCourse, Course, Resource, Block, Quiz, LessonPage } from '../lib/courses';
import { 
  Loader2, Plus, Save, Trash2, ArrowLeft, Video, Image as ImageIcon, 
  AlignLeft, Layout, FileQuestion, ArrowUp, ArrowDown, Bold, List, 
  Type, Columns, Underline, AlignCenter, AlignRight, AlignJustify, 
  Sigma, Scaling, CaseUpper, CaseLower, Space, MessageSquare,
  ListOrdered, Indent, Outdent, Palette, FileText
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const cleanForFirestore = (obj: any): any => {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter(item => item !== undefined);
  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const val = cleanForFirestore(obj[key]);
      if (val !== undefined) acc[key] = val;
      return acc;
    }, {} as any);
  }
  return obj;
};

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (val: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [lineSpacing, setLineSpacing] = useState<'normal' | 'relaxed' | 'loose'>('normal');

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

  const insertLatex = (e: React.MouseEvent) => {
    e.preventDefault();
    const tex = prompt("Introduce tu fórmula en LaTeX (ej: \\frac{1}{2}):");
    if (tex) {
      try {
        const html = katex.renderToString(tex, { throwOnError: false });
        const span = `<span class="math-tex inline-block mx-1 align-middle" contenteditable="false">${html}</span>&nbsp;`;
        document.execCommand('insertHTML', false, span);
        handleInput();
      } catch (err) {
        alert("Error en el formato LaTeX");
      }
    }
  };

  const transformCase = (e: React.MouseEvent, type: 'upper' | 'lower') => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const text = selection.toString();
    if (text) {
      document.execCommand('insertText', false, type === 'upper' ? text.toUpperCase() : text.toLowerCase());
      handleInput();
    }
  };

  const toggleSpacing = (e: React.MouseEvent) => {
    e.preventDefault();
    setLineSpacing(prev => prev === 'normal' ? 'relaxed' : prev === 'relaxed' ? 'loose' : 'normal');
    // Note: Line spacing is applied via a wrapper class on the editor itself to avoid complex DOM manipulation inside contentEditable
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 focus-within:border-cyan-500 transition-colors">
      <div className="flex items-center gap-1 p-2 bg-slate-800 border-b border-slate-700 flex-wrap">
        <button onMouseDown={(e) => format(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors" title="Título 1">H1</button>
        <button onMouseDown={(e) => format(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors" title="Título 2">H2</button>
        <button onMouseDown={(e) => format(e, 'formatBlock', 'H3')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors" title="Título 3">H3</button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>
        
        <button onMouseDown={(e) => format(e, 'bold')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Negrita"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'underline')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Subrayado"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={(e) => format(e, 'fontSize', '2')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold" title="Letra Pequeña">A-</button>
        <button onMouseDown={(e) => format(e, 'fontSize', '3')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold" title="Letra Normal">A</button>
        <button onMouseDown={(e) => format(e, 'fontSize', '5')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold" title="Letra Grande">A+</button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={(e) => transformCase(e, 'upper')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Mayúsculas"><CaseUpper className="w-4 h-4" /></button>
        <button onMouseDown={(e) => transformCase(e, 'lower')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Minúsculas"><CaseLower className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={(e) => format(e, 'justifyLeft')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Alinear Izquierda"><AlignLeft className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'justifyCenter')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Centrar"><AlignCenter className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'justifyRight')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Alinear Derecha"><AlignRight className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'justifyFull')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Justificar"><AlignJustify className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={(e) => format(e, 'insertUnorderedList')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Lista Viñetas"><List className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'insertOrderedList')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Lista Numerada"><ListOrdered className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={(e) => format(e, 'indent')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Aumentar Sangría"><Indent className="w-4 h-4" /></button>
        <button onMouseDown={(e) => format(e, 'outdent')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Reducir Sangría"><Outdent className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <div className="relative group">
          <button className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center" title="Color de Texto"><Palette className="w-4 h-4" /></button>
          <input type="color" onInput={(e) => { document.execCommand('foreColor', false, (e.target as HTMLInputElement).value); handleInput(); }} className="absolute top-0 left-0 w-8 h-8 opacity-0 cursor-pointer" />
        </div>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={toggleSpacing} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Interlineado"><Space className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button onMouseDown={insertLatex} className="p-1.5 hover:bg-emerald-600/50 bg-emerald-900/30 text-emerald-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Insertar Ecuación (LaTeX)">
          <Sigma className="w-4 h-4" /> LaTeX
        </button>
      </div>
      <div 
        ref={editorRef}
        className={`p-4 min-h-[120px] text-slate-300 outline-none prose prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl
          ${lineSpacing === 'relaxed' ? 'leading-relaxed' : lineSpacing === 'loose' ? 'leading-loose' : 'leading-normal'}
        `}
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
                  else if (el.type === 'row') migratedBlocks.push({ id: el.id, type: 'row', columns: el.columns?.map(c => ({ id: c.id, blocks: c.elements.map(e => ({ id: e.id, type: e.type as any, content: e.content, url: e.content })) })) });
                });
              });
              setBlocks(migratedBlocks);
            } else {
              setBlocks([]);
            }
            setQuiz(r.quiz);
          } else {
            navigate(-1);
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
        blocks: cleanForFirestore(blocks),
        quiz: cleanForFirestore(quiz)
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

      await updateCourse(courseId, { modules: cleanForFirestore(updatedModules) });
      alert("Contenido guardado exitosamente");
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
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

  // Block management
  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 6);

  const addBlock = (type: Block['type'], targetArray: Block[], setArray: (arr: Block[]) => void) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: type === 'text' || type === 'box' ? '' : undefined,
      url: type !== 'text' && type !== 'row' && type !== 'box' && type !== 'page-break' ? '' : undefined,
      zoom: type === 'image' ? false : undefined,
      title: type === 'box' ? 'Nuevo Recuadro' : undefined,
      theme: type === 'box' ? 'history' : undefined,
      columns: type === 'row' ? [
        { id: generateId(), blocks: [] },
        { id: generateId(), blocks: [] }
      ] : undefined
    };
    setArray([...targetArray, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down', targetArray: Block[], setArray: (arr: Block[]) => void) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === targetArray.length - 1) return;

    const newBlocks = [...targetArray];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setArray(newBlocks);
  };

  const addColumn = (rowId: string, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.map(b => {
      if (b.id === rowId && b.columns && b.columns.length < 4) {
        return { ...b, columns: [...b.columns, { id: generateId(), blocks: [] }] };
      }
      return b;
    }));
  };

  const removeColumn = (rowId: string, colId: string, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.map(b => {
      if (b.id === rowId && b.columns && b.columns.length > 1) {
        return { ...b, columns: b.columns.filter(c => c.id !== colId) };
      }
      return b;
    }));
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

  const renderBlockEditor = (block: Block, index: number, blocksArray: Block[], setBlocksArray: (arr: Block[]) => void) => {
    if (block.type === 'page-break') {
      return (
        <div key={block.id} className="group relative w-full h-12 bg-slate-800 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-600 text-slate-400 font-bold uppercase tracking-widest my-8 hover:border-slate-500 transition-colors">
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button onClick={() => moveBlock(index, 'up', blocksArray, setBlocksArray)} disabled={index === 0} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => moveBlock(index, 'down', blocksArray, setBlocksArray)} disabled={index === blocksArray.length - 1} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => removeBlock(block.id, blocksArray, setBlocksArray)}
            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg z-20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          --- Salto de Página ---
        </div>
      );
    }

    if (block.type === 'row') {
      return (
        <div key={block.id} className="group relative bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
          
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveBlock(index, 'up', blocksArray, setBlocksArray)} disabled={index === 0} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => moveBlock(index, 'down', blocksArray, setBlocksArray)} disabled={index === blocksArray.length - 1} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => removeBlock(block.id, blocksArray, setBlocksArray)}
            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg z-10"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Columns className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-slate-300 uppercase">Fila ({block.columns?.length} Columnas)</span>
            </div>
            {block.columns && block.columns.length < 4 && (
              <button 
                onClick={() => addColumn(block.id, blocksArray, setBlocksArray)}
                className="text-xs bg-purple-900/30 text-purple-400 hover:text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg font-bold"
              >
                + Añadir Columna
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {block.columns?.map(col => {
              const updateColBlocks = (newBlocks: Block[]) => {
                const newCols = block.columns!.map(c => c.id === col.id ? { ...c, blocks: newBlocks as any } : c);
                updateBlock(block.id, { columns: newCols }, blocksArray, setBlocksArray);
              };

              return (
                <div key={col.id} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 min-h-[150px] flex flex-col relative">
                  {block.columns!.length > 1 && (
                    <button 
                      onClick={() => removeColumn(block.id, col.id, blocksArray, setBlocksArray)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="space-y-4 mt-6">
                    {col.blocks.map((subBlock, subIdx) => 
                      renderBlockEditor(subBlock as Block, subIdx, col.blocks as Block[], updateColBlocks)
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-800 flex justify-center gap-2">
                    <button onClick={() => addBlock('text', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg" title="Añadir Texto"><Type className="w-4 h-4"/></button>
                    <button onClick={() => addBlock('image', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg" title="Añadir Imagen"><ImageIcon className="w-4 h-4"/></button>
                    <button onClick={() => addBlock('video', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg" title="Añadir Video"><Video className="w-4 h-4"/></button>
                    <button onClick={() => addBlock('app', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg" title="Añadir App"><Layout className="w-4 h-4"/></button>
                    <button onClick={() => addBlock('box', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg" title="Añadir Recuadro"><MessageSquare className="w-4 h-4"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={block.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-colors">
        {/* Block Controls */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => moveBlock(index, 'up', blocksArray, setBlocksArray)} disabled={index === 0} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button onClick={() => moveBlock(index, 'down', blocksArray, setBlocksArray)} disabled={index === blocksArray.length - 1} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30">
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={() => removeBlock(block.id, blocksArray, setBlocksArray)}
          className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg z-20"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-slate-800 rounded-lg">
            {block.type === 'text' && <Type className="w-4 h-4 text-cyan-400" />}
            {block.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-400" />}
            {block.type === 'video' && <Video className="w-4 h-4 text-red-400" />}
            {block.type === 'app' && <Layout className="w-4 h-4 text-emerald-400" />}
            {block.type === 'box' && <MessageSquare className="w-4 h-4 text-amber-400" />}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Bloque de {block.type}
          </span>
          
          {block.type === 'image' && (
            <div className="ml-auto flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-xs font-bold text-slate-400">Zoom Educativo</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={block.zoom || false} onChange={(e) => updateBlock(block.id, { zoom: e.target.checked }, blocksArray, setBlocksArray)} />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          )}
        </div>

        {/* Inputs */}
        {block.type === 'box' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input 
                type="text"
                value={block.title || ''}
                onChange={(e) => updateBlock(block.id, { title: e.target.value }, blocksArray, setBlocksArray)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                placeholder="Título del recuadro..."
              />
              <select 
                value={block.theme || 'history'}
                onChange={(e) => updateBlock(block.id, { theme: e.target.value as any }, blocksArray, setBlocksArray)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="history">Contexto Histórico (Café)</option>
                <option value="situation">Situación (Verde)</option>
                <option value="formula">Fórmula (Morado)</option>
                <option value="exercise">Ejercitación (Verde Oscuro)</option>
                <option value="warning">Cuidado (Rojo)</option>
              </select>
            </div>
            <RichTextEditor 
              content={block.content || ''} 
              onChange={(val) => updateBlock(block.id, { content: val }, blocksArray, setBlocksArray)} 
            />
          </div>
        )}

        {block.type === 'text' && (
          <RichTextEditor 
            content={block.content || ''} 
            onChange={(val) => updateBlock(block.id, { content: val }, blocksArray, setBlocksArray)} 
          />
        )}

        {block.type === 'image' && (
          <div className="space-y-3">
            <input 
              type="url"
              value={block.url || ''}
              onChange={(e) => updateBlock(block.id, { url: e.target.value }, blocksArray, setBlocksArray)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="URL Raw de GitHub (ej: https://raw.githubusercontent.com/...)"
            />
            <p className="text-xs text-slate-500 italic">💡 Sube la imagen a tu repositorio en GitHub y pega aquí la URL "Raw".</p>
            {block.url && (
              <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden bg-black/50 flex justify-center">
                <img src={block.url} alt="Preview" className="max-h-64 object-contain" />
              </div>
            )}
          </div>
        )}

        {(block.type === 'video' || block.type === 'app') && (
          <div className="space-y-4">
            <input 
              type="url"
              value={block.url || ''}
              onChange={(e) => updateBlock(block.id, { url: e.target.value }, blocksArray, setBlocksArray)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder={block.type === 'video' ? "URL del video (YouTube)" : "URL de tu simulador interactivo"}
            />
            {block.url && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
                <iframe 
                  src={getEmbedUrl(block.url)} 
                  className="w-full h-full pointer-events-none" // pointer-events-none to avoid trapping scroll in editor
                  allowFullScreen 
                ></iframe>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;

  return (
    <div className="w-full px-4 sm:px-8 mx-auto space-y-6 pb-20">
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
        <div className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
              <button onClick={() => addBlock('text', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors whitespace-nowrap">
                <Type className="w-4 h-4" /> Texto
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('image', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors whitespace-nowrap">
                <ImageIcon className="w-4 h-4" /> Imagen
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('video', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors whitespace-nowrap">
                <Video className="w-4 h-4" /> Video
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('app', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors whitespace-nowrap">
                <Layout className="w-4 h-4" /> App
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('box', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors whitespace-nowrap">
                <MessageSquare className="w-4 h-4" /> Recuadro
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('row', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-purple-400 transition-colors whitespace-nowrap">
                <Columns className="w-4 h-4" /> Fila
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <button onClick={() => addBlock('page-break', blocks, setBlocks)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap bg-slate-800 border border-slate-700 ml-1">
                <FileText className="w-4 h-4" /> Añadir Página
              </button>
            </div>
          )}
        </div>

        {/* Editor Content Area */}
        <div className="p-4 sm:p-8 flex-1 bg-[#0a0f1c]">
          {activeTab === 'content' && (
            <div className="w-full mx-auto space-y-6">
              {blocks.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                  <Layout className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">El lienzo está vacío</h3>
                  <p className="text-slate-400">Utiliza la barra de herramientas superior para añadir bloques.</p>
                </div>
              )}

              {blocks.map((block, index) => renderBlockEditor(block, index, blocks, setBlocks))}

              {blocks.length > 0 && (
                <div className="flex justify-center pt-8 pb-4">
                  <p className="text-slate-500 text-sm font-medium">Fin de la clase</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-6">
               {/* Quiz Editor code... same as before */}
               {!quiz ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                  <FileQuestion className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Evalúa el aprendizaje</h3>
                  <button onClick={initializeQuiz} className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                    Habilitar Test de Nivel
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-white">Configuración del Test</h2>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-400 font-bold">Aprobar con:</label>
                      <input 
                        type="number" min="1" max="100" 
                        value={quiz.passingScore}
                        onChange={(e) => setQuiz({...quiz, passingScore: Number(e.target.value)})}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 text-center"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  {quiz.questions.map((q, i) => (
                    <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group">
                      <button onClick={() => setQuiz({...quiz, questions: quiz.questions.filter(qu => qu.id !== q.id)})} className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex gap-4 mb-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1 space-y-4">
                          <textarea value={q.text} onChange={(e) => updateQuestion(q.id, 'text', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none min-h-[80px]" placeholder="Pregunta..." />
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-3">
                                <input type="radio" name={`correct_${q.id}`} checked={q.correctOptionIndex === optIdx} onChange={() => updateQuestion(q.id, 'correctOptionIndex', optIdx)} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                                <input type="text" value={opt} onChange={(e) => updateOption(q.id, optIdx, e.target.value)} className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2 text-sm text-white focus:outline-none transition-colors ${q.correctOptionIndex === optIdx ? 'border-emerald-500/50' : 'border-slate-800 focus:border-cyan-500/50'}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-950/10 font-bold transition-all flex items-center justify-center gap-2">
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
