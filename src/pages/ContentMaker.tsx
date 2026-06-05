import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourseById, updateCourse, Course, Resource, Block, Quiz, LessonPage } from '../lib/courses';
import { 
  Loader2, Plus, Save, Trash2, ArrowLeft, Video, Image as ImageIcon, 
  AlignLeft, Layout, FileQuestion, ArrowUp, ArrowDown, Bold, List, 
  Type, Columns, Underline, AlignCenter, AlignRight, AlignJustify, 
  Sigma, Scaling, CaseUpper, CaseLower, Space, MessageSquare,
  ListOrdered, Indent, Outdent, Palette, FileText, ChevronDown, CheckCircle, FolderTree, GripVertical
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import EquationEditorModal from '../components/EquationEditorModal';
import RichTextEditor from '../components/ui/RichTextEditor';

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

  const addBlock = (type: Block['type'], targetArray: Block[], setArray: (arr: Block[]) => void, theme?: Block['theme']) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: type === 'text' || type === 'box' || type === 'challenge' ? '' : undefined,
      url: ['image', 'video', 'app'].includes(type) ? '' : undefined,
      zoom: type === 'image' ? false : undefined,
      title: type === 'box' ? (theme === 'theorem' ? 'Teorema / Definición' : theme === 'alert' ? 'Alerta' : 'Nuevo Recuadro') : undefined,
      theme: type === 'box' ? (theme || 'history') : undefined,
      columns: type === 'row' ? [
        { id: generateId(), blocks: [] },
        { id: generateId(), blocks: [] }
      ] : undefined,
      // Default props for new blocks
      solution: type === 'challenge' ? '' : undefined,
      tabsContent: type === 'tabs' ? [{ id: generateId(), title: 'Pestaña 1', content: '' }, { id: generateId(), title: 'Pestaña 2', content: '' }] : undefined,
      accordionItems: type === 'accordion' ? [{ id: generateId(), title: 'Elemento 1', content: '' }] : undefined,
      quizData: type === 'inline-quiz' ? { question: '', options: ['', ''], correctIndex: 0 } : undefined,
      // Default props for app and video
      height: type === 'app' ? 500 : undefined,
      rounded: type === 'app' ? true : undefined,
      shadow: type === 'app' ? true : undefined,
      caption: type === 'video' ? '' : undefined,
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
                <option value="theorem">Teorema/Definición (Azul/Verde)</option>
                <option value="alert">Alerta/Error (Naranja)</option>
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

        {block.type === 'video' && (
          <div className="space-y-4">
            <input 
              type="url"
              value={block.url || ''}
              onChange={(e) => updateBlock(block.id, { url: e.target.value }, blocksArray, setBlocksArray)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="URL del video (YouTube)"
            />
            <input
              type="text"
              value={block.caption || ''}
              onChange={(e) => updateBlock(block.id, { caption: e.target.value }, blocksArray, setBlocksArray)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
              placeholder="Leyenda inferior (opcional)"
            />
            {block.url && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
                <iframe 
                  src={getEmbedUrl(block.url)} 
                  className="w-full h-full pointer-events-none"
                  allowFullScreen 
                ></iframe>
              </div>
            )}
          </div>
        )}

        {block.type === 'app' && (
          <div className="space-y-4">
            <input 
              type="url"
              value={block.url || ''}
              onChange={(e) => updateBlock(block.id, { url: e.target.value }, blocksArray, setBlocksArray)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="URL de tu simulador interactivo"
            />
            
            <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Alto (px)</label>
                <input 
                  type="number"
                  value={block.height || 500}
                  onChange={(e) => updateBlock(block.id, { height: Number(e.target.value) }, blocksArray, setBlocksArray)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white w-24 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Ancho (px o %)</label>
                <input 
                  type="text"
                  value={block.width || '100%'}
                  onChange={(e) => updateBlock(block.id, { width: e.target.value }, blocksArray, setBlocksArray)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white w-28 focus:outline-none focus:border-cyan-500"
                  placeholder="100%"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Alineación</label>
                <select
                  value={block.align || 'center'}
                  onChange={(e) => updateBlock(block.id, { align: e.target.value as any }, blocksArray, setBlocksArray)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id={`rounded-${block.id}`}
                  checked={block.rounded ?? true}
                  onChange={(e) => updateBlock(block.id, { rounded: e.target.checked }, blocksArray, setBlocksArray)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                />
                <label htmlFor={`rounded-${block.id}`} className="text-sm text-slate-300">Bordes redondeados</label>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id={`shadow-${block.id}`}
                  checked={block.shadow ?? true}
                  onChange={(e) => updateBlock(block.id, { shadow: e.target.checked }, blocksArray, setBlocksArray)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                />
                <label htmlFor={`shadow-${block.id}`} className="text-sm text-slate-300">Sombra decorativa</label>
              </div>
            </div>

            {block.url && (
              <div className={`w-full flex ${block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center'}`}>
                <div className={`bg-black border border-slate-800 ${block.rounded !== false ? 'rounded-2xl' : ''} ${block.shadow !== false ? 'shadow-2xl shadow-emerald-900/20' : ''} overflow-hidden`} style={{ height: `${block.height || 500}px`, width: block.width || '100%', maxWidth: '100%' }}>
                  <iframe 
                    src={block.url} 
                    className="w-full h-full pointer-events-none"
                    allowFullScreen 
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        )}

        {block.type === 'challenge' && (
          <div className="space-y-4">
            <h4 className="text-emerald-400 font-bold mb-2">Enunciado (Siempre visible)</h4>
            <RichTextEditor 
              content={block.content || ''} 
              onChange={(val) => updateBlock(block.id, { content: val }, blocksArray, setBlocksArray)} 
            />
            <h4 className="text-emerald-400 font-bold mb-2 mt-4">Desarrollo (Oculto)</h4>
            <RichTextEditor 
              content={block.solution || ''} 
              onChange={(val) => updateBlock(block.id, { solution: val }, blocksArray, setBlocksArray)} 
            />
          </div>
        )}

        {block.type === 'tabs' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {block.tabsContent?.map((tab, tIdx) => (
                <div key={tab.id} className="flex flex-col gap-2 min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={tab.title} 
                      onChange={(e) => {
                        const newTabs = [...block.tabsContent!];
                        newTabs[tIdx].title = e.target.value;
                        updateBlock(block.id, { tabsContent: newTabs }, blocksArray, setBlocksArray);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white flex-1 focus:outline-none focus:border-cyan-500"
                    />
                    {block.tabsContent!.length > 1 && (
                      <button onClick={() => {
                        const newTabs = block.tabsContent!.filter((_, i) => i !== tIdx);
                        updateBlock(block.id, { tabsContent: newTabs }, blocksArray, setBlocksArray);
                      }} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                    )}
                  </div>
                  <RichTextEditor 
                    content={tab.content} 
                    onChange={(val) => {
                      const newTabs = [...block.tabsContent!];
                      newTabs[tIdx].content = val;
                      updateBlock(block.id, { tabsContent: newTabs }, blocksArray, setBlocksArray);
                    }} 
                  />
                </div>
              ))}
              <button 
                onClick={() => {
                  const newTabs = [...(block.tabsContent || []), { id: Date.now().toString(), title: `Pestaña ${(block.tabsContent?.length || 0) + 1}`, content: '' }];
                  updateBlock(block.id, { tabsContent: newTabs }, blocksArray, setBlocksArray);
                }}
                className="h-10 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold flex-shrink-0"
              >
                + Añadir Pestaña
              </button>
            </div>
          </div>
        )}

        {block.type === 'accordion' && (
          <div className="space-y-4">
            {block.accordionItems?.map((item, iIdx) => (
              <div key={item.id} className="border border-slate-700 rounded-xl p-4 bg-slate-950 space-y-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={item.title} 
                    onChange={(e) => {
                      const newItems = [...block.accordionItems!];
                      newItems[iIdx].title = e.target.value;
                      updateBlock(block.id, { accordionItems: newItems }, blocksArray, setBlocksArray);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    placeholder="Pregunta o Título..."
                  />
                  {block.accordionItems!.length > 1 && (
                    <button onClick={() => {
                      const newItems = block.accordionItems!.filter((_, i) => i !== iIdx);
                      updateBlock(block.id, { accordionItems: newItems }, blocksArray, setBlocksArray);
                    }} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                  )}
                </div>
                <RichTextEditor 
                  content={item.content} 
                  onChange={(val) => {
                    const newItems = [...block.accordionItems!];
                    newItems[iIdx].content = val;
                    updateBlock(block.id, { accordionItems: newItems }, blocksArray, setBlocksArray);
                  }} 
                />
              </div>
            ))}
            <button 
              onClick={() => {
                const newItems = [...(block.accordionItems || []), { id: Date.now().toString(), title: `Elemento ${(block.accordionItems?.length || 0) + 1}`, content: '' }];
                updateBlock(block.id, { accordionItems: newItems }, blocksArray, setBlocksArray);
              }}
              className="w-full py-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 font-bold transition-colors"
            >
              + Añadir Elemento Desplegable
            </button>
          </div>
        )}

        {block.type === 'inline-quiz' && block.quizData && (
          <div className="space-y-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
            <div>
              <label className="text-sm font-bold text-slate-400">Pregunta (Mini-Quiz)</label>
              <input 
                type="text" 
                value={block.quizData.question} 
                onChange={(e) => updateBlock(block.id, { quizData: { ...block.quizData!, question: e.target.value } }, blocksArray, setBlocksArray)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white mt-2 focus:outline-none focus:border-cyan-500"
                placeholder="Ej: ¿Cuál es el resultado de 2 + 2?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 mb-2 block">Opciones (marca el círculo de la correcta)</label>
              {block.quizData.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name={`correct-${block.id}`} 
                    checked={block.quizData?.correctIndex === oIdx} 
                    onChange={() => updateBlock(block.id, { quizData: { ...block.quizData!, correctIndex: oIdx } }, blocksArray, setBlocksArray)}
                    className="w-5 h-5 accent-cyan-500"
                  />
                  <input 
                    type="text" 
                    value={opt} 
                    onChange={(e) => {
                      const newOptions = [...block.quizData!.options];
                      newOptions[oIdx] = e.target.value;
                      updateBlock(block.id, { quizData: { ...block.quizData!, options: newOptions } }, blocksArray, setBlocksArray);
                    }}
                    className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none transition-all ${block.quizData?.correctIndex === oIdx ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-700'}`}
                    placeholder={`Opción ${oIdx + 1}`}
                  />
                  {block.quizData!.options.length > 2 && (
                    <button onClick={() => {
                      const newOptions = block.quizData!.options.filter((_, i) => i !== oIdx);
                      let newCorrect = block.quizData!.correctIndex;
                      if (newCorrect === oIdx) newCorrect = 0;
                      else if (newCorrect > oIdx) newCorrect--;
                      updateBlock(block.id, { quizData: { ...block.quizData!, options: newOptions, correctIndex: newCorrect } }, blocksArray, setBlocksArray);
                    }} className="text-slate-500 hover:text-red-400 p-2"><Trash2 className="w-4 h-4"/></button>
                  )}
                </div>
              ))}
              {block.quizData.options.length < 5 && (
                <button onClick={() => {
                  updateBlock(block.id, { quizData: { ...block.quizData!, options: [...block.quizData!.options, ''] } }, blocksArray, setBlocksArray);
                }} className="text-cyan-400 text-sm font-bold mt-2 hover:underline inline-block">
                  + Añadir Opción
                </button>
              )}
            </div>
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
            <div className="flex items-center gap-2 sm:gap-4 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-visible">
              
              {/* Básicos */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Type className="w-4 h-4" /> Básicos <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col py-1">
                  <button onClick={() => addBlock('text', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><Type className="w-4 h-4 text-cyan-400"/> Texto Simple</button>
                  <button onClick={() => addBlock('image', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-blue-400"/> Imagen</button>
                  <button onClick={() => addBlock('page-break', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><FileText className="w-4 h-4 text-white"/> Salto de Página</button>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-700"></div>

              {/* Pedagógicos */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" /> Pedagógicos <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col py-1">
                  <button onClick={() => addBlock('box', blocks, setBlocks, 'theorem')} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-400"/> Teorema / Definición</button>
                  <button onClick={() => addBlock('box', blocks, setBlocks, 'alert')} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-orange-400"/> Alerta / Error Común</button>
                  <button onClick={() => addBlock('box', blocks, setBlocks, 'history')} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-400"/> Recuadro (Dato Curioso)</button>
                  <button onClick={() => addBlock('box', blocks, setBlocks, 'formula')} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-green-400"/> Recuadro (Fórmula)</button>
                  <button onClick={() => addBlock('challenge', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400"/> Desafío Matemático</button>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-700"></div>

              {/* Estructura */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Columns className="w-4 h-4" /> Estructura <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col py-1">
                  <button onClick={() => addBlock('row', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><Columns className="w-4 h-4 text-purple-400"/> Columnas Flexibles</button>
                  <button onClick={() => addBlock('tabs', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><FolderTree className="w-4 h-4 text-pink-400"/> Pestañas (Tabs)</button>
                  <button onClick={() => addBlock('accordion', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><GripVertical className="w-4 h-4 text-indigo-400"/> Acordeón Desplegable</button>
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-700"></div>

              {/* Interactivos */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Layout className="w-4 h-4" /> Interactivos <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full right-0 sm:left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col py-1">
                  <button onClick={() => addBlock('app', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><Layout className="w-4 h-4 text-emerald-400"/> App / Simulador Pro</button>
                  <button onClick={() => addBlock('video', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><Video className="w-4 h-4 text-red-400"/> Contenedor de Video</button>
                  <button onClick={() => addBlock('inline-quiz', blocks, setBlocks)} className="text-left px-4 py-2 hover:bg-slate-800 text-sm text-slate-300 flex items-center gap-2"><FileQuestion className="w-4 h-4 text-yellow-400"/> Mini-Quiz Formativo</button>
                </div>
              </div>

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
