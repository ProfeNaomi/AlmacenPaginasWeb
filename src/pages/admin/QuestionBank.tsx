import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Bot, Save, Trash2, Image as ImageIcon, Loader2, UploadCloud, X, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Question, getQuestions, createQuestion, updateQuestion, deleteQuestion, QuestionAxis, QuestionSource, QuestionLevel } from '../../lib/paes';
import { generateMathSolution, hasAIConfigured } from '../../lib/ai';
import RichTextEditor from '../../components/ui/RichTextEditor';
import PaesQuestionPreview from '../../components/ui/PaesQuestionPreview';

const AXIS_BY_LEVEL: Record<QuestionLevel, QuestionAxis[]> = {
  'Secundaria': ['Números', 'Álgebra y Funciones', 'Geometría', 'Probabilidad y Estadística'],
  'Universitario': ['Cálculo', 'Álgebra', 'Lógica', 'Geometría', 'Probabilidad y Estadística']
};

const INITIAL_TOPICS_BY_AXIS: Record<string, string[]> = {
  'Números': ['Conjuntos Numéricos', 'Porcentajes', 'Potencias', 'Raíces', 'Logaritmos'],
  'Álgebra y Funciones': ['Expresiones Algebraicas', 'Ecuaciones', 'Inecuaciones', 'Sistemas de Ecuaciones', 'Funciones (Lineal y Afín)', 'Función Cuadrática'],
  'Geometría': ['Figuras Geométricas', 'Transformaciones Isométricas', 'Semejanza y Proporcionalidad', 'Teorema de Pitágoras', 'Cuerpos Geométricos', 'Geometría Analítica', 'Cálculo Vectorial'],
  'Probabilidad y Estadística': ['Estadística Descriptiva', 'Técnicas de Conteo', 'Probabilidades', 'Inferencia Estadística', 'Distribuciones de Probabilidad'],
  'Cálculo': ['Límites', 'Derivadas', 'Integrales', 'Ecuaciones Diferenciales', 'Series'],
  'Álgebra': ['Álgebra Lineal', 'Matrices', 'Espacios Vectoriales', 'Polinomios'],
  'Lógica': ['Lógica Proposicional', 'Teoría de Conjuntos'],
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Folders
  const [examFilter, setExamFilter] = useState<string>('Todos');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [solution, setSolution] = useState('');
  const [level, setLevel] = useState<QuestionLevel>('Secundaria');
  const [axis, setAxis] = useState<QuestionAxis>('Números');
  const [source, setSource] = useState<QuestionSource>('Propio');
  const [topic, setTopic] = useState('');
  const [skill, setSkill] = useState('Resolver problemas');
  const [examReference, setExamReference] = useState('');
  const [questionNumber, setQuestionNumber] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [importingBatch, setImportingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive dynamic topics from initial + questions in DB
  const globalTopicsByAxis = React.useMemo(() => {
    const topics: Record<string, Set<string>> = {};
    Object.entries(INITIAL_TOPICS_BY_AXIS).forEach(([a, tList]) => {
      if (!topics[a]) topics[a] = new Set();
      tList.forEach(t => topics[a].add(t));
    });
    questions.forEach(q => {
      if (!topics[q.axis]) topics[q.axis] = new Set();
      if (q.topic) topics[q.axis].add(q.topic);
    });
    const result: Record<string, string[]> = {};
    Object.keys(topics).forEach(a => {
      result[a] = Array.from(topics[a]).sort();
    });
    return result;
  }, [questions]);

  // Derive unique exams for the filter dropdown
  const uniqueExams = React.useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => { if (q.examReference) set.add(q.examReference) });
    return Array.from(set).sort();
  }, [questions]);

  const filteredQuestions = React.useMemo(() => {
    let filtered = questions;
    if (examFilter === 'SUELTAS') {
      filtered = questions.filter(q => !q.examReference);
    } else if (examFilter !== 'Todos') {
      filtered = questions.filter(q => q.examReference === examFilter);
    }
    // Sort by questionNumber
    filtered.sort((a, b) => {
      const numA = parseInt(a.questionNumber || '999') || 999;
      const numB = parseInt(b.questionNumber || '999') || 999;
      return numA - numB;
    });
    return filtered;
  }, [questions, examFilter]);

  // Group by ExamReference for Folders
  const questionsByExam = React.useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    filteredQuestions.forEach(q => {
      const ref = q.examReference || 'Preguntas Sueltas (Sin Ensayo)';
      if (!grouped[ref]) grouped[ref] = [];
      grouped[ref].push(q);
    });
    return grouped;
  }, [filteredQuestions]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => 
      prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]
    );
  };

  const handleImportBatch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let content = (e.target?.result as string) || '';
        
        // Limpiar bloques de código markdown si el usuario los copió y pegó por accidente
        content = content.trim();
        if (content.startsWith('```json')) {
          content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (content.startsWith('```')) {
          content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          const examRefPrompt = prompt("¿A qué ensayo pertenecen estas preguntas? (Ej. 'PAES Invierno 2026' o déjalo en blanco para preguntas sueltas)");
          const batchExamRef = examRefPrompt ? examRefPrompt.trim() : undefined;
          
          setImportingBatch(true);
          let successCount = 0;
          for (const item of data) {
            if (item.text && item.options && item.correctAnswer !== undefined) {
              await createQuestion({
                text: item.text,
                imageUrl: item.imageUrl || '',
                options: item.options,
                correctAnswer: item.correctAnswer,
                solution: item.solution || '',
                level: item.level || 'Secundaria',
                axis: item.axis || 'Números',
                source: item.source || 'Propio',
                topic: item.topic || 'Otro',
                skill: item.skill || 'Resolver problemas',
                examReference: item.examReference || batchExamRef || '',
                questionNumber: item.questionNumber || ''
              });
              successCount++;
            }
          }
          alert(`¡Lote importado exitosamente! Se agregaron ${successCount} preguntas.`);
          loadQuestions();
        } else {
          alert("Error: El archivo debe contener un arreglo de preguntas.");
        }
      } catch (error: any) {
        console.error("Error al parsear el JSON:", error);
        alert("Error de formato JSON: " + error.message + "\n\nAsegúrate de que el archivo contiene un arreglo JSON válido.");
      } finally {
        setImportingBatch(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const data = await getQuestions();
    setQuestions(data);
    
    // Auto-expand all folders initially
    const set = new Set<string>();
    data.forEach(q => set.add(q.examReference || 'Preguntas Sueltas (Sin Ensayo)'));
    setExpandedFolders(Array.from(set));
    
    setLoading(false);
  };

  const openNew = () => {
    setText('');
    setImageUrl('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setSolution('');
    setLevel('Secundaria');
    setAxis('Números');
    setSource('Propio');
    setTopic(globalTopicsByAxis['Números']?.[0] || 'Otro');
    setSkill('Resolver problemas');
    setExamReference('');
    setQuestionNumber('');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setText(q.text);
    setImageUrl(q.imageUrl || '');
    setOptions(q.options);
    setCorrectAnswer(q.correctAnswer);
    setSolution(q.solution);
    setLevel(q.level);
    setAxis(q.axis);
    setSource(q.source);
    setTopic(q.topic);
    setSkill(q.skill);
    setExamReference(q.examReference || '');
    setQuestionNumber(q.questionNumber || '');
    setEditingId(q.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!text || options.filter(o => o.trim() !== '').length < 2) {
      alert("La pregunta debe tener texto y al menos 2 alternativas.");
      return;
    }

    const data = {
      text,
      imageUrl,
      options,
      correctAnswer,
      solution,
      level,
      axis,
      source,
      topic,
      skill,
      examReference,
      questionNumber
    };

    if (editingId) {
      await updateQuestion(editingId, data);
    } else {
      await createQuestion(data);
    }
    setIsModalOpen(false);
    loadQuestions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      await deleteQuestion(id);
      loadQuestions();
    }
  };

  const handleGenerateAI = async () => {
    if (!hasAIConfigured()) {
      alert('Debes configurar tu API Key de Gemini en Ajustes primero.');
      return;
    }
    if (!text || options.filter(o => o.trim() !== '').length < 2) {
      alert('Debes ingresar la pregunta y al menos 2 alternativas para que la IA pueda resolverla.');
      return;
    }

    setGenerating(true);
    try {
      const generatedSolution = await generateMathSolution(text, options, imageUrl);
      setSolution(generatedSolution);
    } catch (error: any) {
      alert('Error al generar: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Multiple updates to keep state consistent (e.g., when changing axis, topic resets)
  const handleInlineUpdates = async (id: string, updates: Partial<Question>) => {
    // Optimistic UI update
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    // Save to DB
    await updateQuestion(id, updates);
  };

  const handleDropdownAction = async (id: string, field: 'examReference' | 'topic', actionValue: string, currentValue: string) => {
    if (actionValue === 'NEW_TOPIC') {
      const newTopic = prompt("Ingresa el nuevo tema:");
      if (!newTopic || newTopic.trim() === '') return;
      handleInlineUpdates(id, { topic: newTopic.trim() });
    } 
    else if (actionValue === 'RENAME_TOPIC') {
      const newTopic = prompt(`Renombrar el tema "${currentValue}" a:`, currentValue);
      if (!newTopic || newTopic.trim() === '' || newTopic === currentValue) return;
      
      const qToUpdate = questions.filter(q => q.topic === currentValue);
      if (confirm(`¿Actualizar el tema en ${qToUpdate.length} preguntas?`)) {
        setLoading(true);
        for (const q of qToUpdate) {
          await updateQuestion(q.id, { topic: newTopic.trim() });
        }
        loadQuestions();
      }
    }
    else if (actionValue === 'DELETE_TOPIC') {
      const qToUpdate = questions.filter(q => q.topic === currentValue);
      if (confirm(`¿Eliminar este tema y pasar ${qToUpdate.length} preguntas a "Otro"?`)) {
        setLoading(true);
        for (const q of qToUpdate) {
          await updateQuestion(q.id, { topic: 'Otro' });
        }
        loadQuestions();
      }
    }
    else if (actionValue === 'NEW_EXAM') {
      const newRef = prompt("Ingresa el nombre del nuevo Ensayo de Origen:");
      if (!newRef || newRef.trim() === '') return;
      const refName = newRef.trim();
      handleInlineUpdates(id, { examReference: refName });
      if (!expandedFolders.includes(refName)) {
        setExpandedFolders(prev => [...prev, refName]);
      }
    }
    else if (actionValue === 'RENAME_EXAM') {
      const newRef = prompt(`Renombrar el ensayo "${currentValue}" a:`, currentValue);
      if (!newRef || newRef.trim() === '' || newRef === currentValue) return;
      
      const qToUpdate = questions.filter(q => (q.examReference || '') === currentValue);
      if (confirm(`¿Actualizar el nombre de ensayo en ${qToUpdate.length} preguntas?`)) {
        setLoading(true);
        for (const q of qToUpdate) {
          await updateQuestion(q.id, { examReference: newRef.trim() });
        }
        loadQuestions();
      }
    }
    else if (actionValue === 'DELETE_EXAM') {
      const qToUpdate = questions.filter(q => (q.examReference || '') === currentValue);
      if (confirm(`¿Desvincular ${qToUpdate.length} preguntas de este ensayo? Pasarán a ser "Sueltas".`)) {
        setLoading(true);
        for (const q of qToUpdate) {
          await updateQuestion(q.id, { examReference: '' });
        }
        loadQuestions();
      }
    }
    else {
      // Normal value selection
      handleInlineUpdates(id, { [field]: actionValue });
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderName: string, qs: Question[]) => {
    e.stopPropagation();
    if (confirm(`⚠️ ATENCIÓN: ¿Estás seguro de ELIMINAR PERMANENTEMENTE TODAS las ${qs.length} preguntas de la carpeta "${folderName}"? Esta acción borrará las preguntas del sistema y no se puede deshacer.`)) {
      setLoading(true);
      for (const q of qs) {
        await deleteQuestion(q.id);
      }
      loadQuestions();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Banco de Preguntas PAES</h1>
          <p className="text-slate-400">Gestiona tus ejercicios agrupados por Ensayo de Origen.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportBatch} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importingBatch}
            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50"
            title="Importar preguntas masivamente desde JSON generado por IA"
          >
            {importingBatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {importingBatch ? 'Importando...' : 'Importar Lote IA'}
          </button>
          <button 
            onClick={openNew}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/20"
          >
            <Plus className="w-5 h-5" /> Nueva Pregunta
          </button>
        </div>
      </div>
      
      {/* Filtro de Ensayo */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 mb-8">
        <Filter className="w-5 h-5 text-cyan-500" />
        <span className="font-bold text-slate-300">Mostrar solo:</span>
        <select 
          value={examFilter} 
          onChange={e => setExamFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:border-cyan-500"
        >
          <option value="Todos">Todos los ensayos y carpetas</option>
          <option value="SUELTAS">Preguntas Sueltas (Sin Ensayo)</option>
          {uniqueExams.filter(Boolean).map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(questionsByExam) as [string, Question[]][]).sort().map(([folderName, qs]) => {
            const isExpanded = expandedFolders.includes(folderName);
            
            return (
              <div key={folderName} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50 shadow-lg">
                <div className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 transition-colors">
                  <button 
                    onClick={() => toggleFolder(folderName)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-cyan-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    <Folder className="w-6 h-6 text-amber-500" />
                    <h2 className="font-bold text-lg text-white">{folderName}</h2>
                  </button>
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="text-slate-400">{qs.length} preguntas</span>
                    <button 
                      onClick={(e) => handleDeleteFolder(e, folderName, qs)} 
                      className="p-2 bg-slate-900/50 hover:bg-red-600 rounded-lg text-slate-400 hover:text-white transition-colors" 
                      title="Eliminar TODAS las preguntas de esta carpeta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {qs.map(q => (
                      <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group relative shadow-md">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(q)} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(q.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4 pr-20 items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                          
                          {/* 1. Ensayo de Origen (Dropdown) */}
                          <select
                            value={q.examReference || ''}
                            onChange={(e) => handleDropdownAction(q.id, 'examReference', e.target.value, q.examReference || '')}
                            className="text-xs font-bold bg-amber-900/30 text-amber-400 px-2 py-1.5 rounded border border-amber-800 focus:outline-none cursor-pointer hover:bg-amber-900/50 transition-colors max-w-[150px] truncate"
                            title="Ensayo de Origen / Carpeta"
                          >
                            <option value="">Sueltas (Sin Ensayo)</option>
                            {uniqueExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                            <option disabled>-----------</option>
                            <option value="NEW_EXAM">+ Añadir Nuevo Ensayo...</option>
                            {q.examReference && <option value="RENAME_EXAM">- Renombrar este Ensayo...</option>}
                            {q.examReference && <option value="DELETE_EXAM">- Eliminar este Ensayo...</option>}
                          </select>

                          {/* 2. Número */}
                          <input 
                            type="text"
                            defaultValue={q.questionNumber || ''}
                            onBlur={(e) => {
                              if(e.target.value !== q.questionNumber) handleInlineUpdates(q.id, { questionNumber: e.target.value });
                            }}
                            className="w-12 text-center text-xs font-bold bg-white/10 text-white px-2 py-1.5 rounded border border-white/20 focus:outline-none focus:border-cyan-500"
                            placeholder="Nº"
                            title="Número (ej. 1)"
                          />
                          
                          {/* Nivel (Readonly inline for simplicity) */}
                          <span className={`text-xs font-bold px-2 py-1.5 rounded border ${q.level === 'Universitario' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-pink-900/30 text-pink-400 border-pink-800'}`}>{q.level || 'Secundaria'}</span>
                          
                          {/* 3. Eje Temático */}
                          <select 
                            value={q.axis} 
                            onChange={(e) => {
                              const newAxis = e.target.value as QuestionAxis;
                              const newTopic = globalTopicsByAxis[newAxis]?.[0] || 'Otro';
                              handleInlineUpdates(q.id, { axis: newAxis, topic: newTopic });
                            }}
                            className="text-xs font-bold bg-cyan-900/30 text-cyan-400 px-2 py-1.5 rounded border border-cyan-800 focus:outline-none cursor-pointer hover:bg-cyan-900/50 transition-colors"
                          >
                            {AXIS_BY_LEVEL[q.level || 'Secundaria'].map(a => <option key={a} value={a}>{a}</option>)}
                          </select>

                          {/* 4. Tema Específico */}
                          <select 
                            value={q.topic} 
                            onChange={(e) => handleDropdownAction(q.id, 'topic', e.target.value, q.topic)}
                            className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1.5 rounded border border-slate-700 focus:outline-none cursor-pointer hover:bg-slate-700 transition-colors max-w-[150px] truncate"
                          >
                            <option value={q.topic}>{q.topic}</option>
                            {(globalTopicsByAxis[q.axis] || []).filter(t => t !== q.topic).map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                            <option disabled>-----------</option>
                            <option value="NEW_TOPIC">+ Añadir nuevo tema...</option>
                            <option value="RENAME_TOPIC">- Renombrar este tema...</option>
                            <option value="DELETE_TOPIC">- Eliminar este tema...</option>
                          </select>

                          {/* 5. Origen / Fuente */}
                          <select 
                            value={q.source} 
                            onChange={(e) => handleInlineUpdates(q.id, { source: e.target.value as any })}
                            className="text-xs font-bold bg-purple-900/30 text-purple-400 px-2 py-1.5 rounded border border-purple-800 focus:outline-none cursor-pointer hover:bg-purple-900/50 transition-colors"
                          >
                            <option value="DEMRE">DEMRE</option>
                            <option value="Propio">Propio</option>
                            <option value="Universidades">Universidades</option>
                            <option value="Otro">Otro Ensayo</option>
                          </select>
                          
                          {/* 6. Habilidad */}
                          <select 
                            value={q.skill} 
                            onChange={(e) => handleInlineUpdates(q.id, { skill: e.target.value })}
                            className="text-xs font-bold bg-emerald-900/30 text-emerald-400 px-2 py-1.5 rounded border border-emerald-800 focus:outline-none cursor-pointer hover:bg-emerald-900/50 transition-colors"
                          >
                            <option value="Resolver problemas">Resolver problemas</option>
                            <option value="Representar">Representar</option>
                            <option value="Modelar">Modelar</option>
                            <option value="Argumentar">Argumentar</option>
                            <option value={q.skill}>{q.skill}</option> {/* fallback for custom skills */}
                          </select>
                        </div>
                        
                        <div className="overflow-hidden rounded-xl bg-slate-950 p-2">
                          <PaesQuestionPreview question={q} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800">
              <p className="text-slate-400 mb-4">No hay preguntas que coincidan con este filtro.</p>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl relative my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md rounded-t-2xl z-10">
              <h2 className="text-2xl font-display font-bold text-white">{editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Número</label>
                  <input type="text" value={questionNumber} onChange={e => setQuestionNumber(e.target.value)} placeholder="Ej. 1" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Ensayo de Origen / Carpeta</label>
                  <input type="text" value={examReference} onChange={e => setExamReference(e.target.value)} placeholder="Ej. PAES Invierno 2026" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Nivel</label>
                  <select 
                    value={level} 
                    onChange={e => {
                      const newLevel = e.target.value as QuestionLevel;
                      setLevel(newLevel);
                      const newAxis = AXIS_BY_LEVEL[newLevel][0];
                      setAxis(newAxis);
                      setTopic(globalTopicsByAxis[newAxis]?.[0] || '');
                    }} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  >
                    <option value="Secundaria">Secundaria (M1/M2)</option>
                    <option value="Universitario">Universitario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Eje Temático</label>
                  <select 
                    value={axis} 
                    onChange={e => {
                      const newAxis = e.target.value as QuestionAxis;
                      setAxis(newAxis);
                      setTopic(globalTopicsByAxis[newAxis]?.[0] || '');
                    }} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  >
                    {AXIS_BY_LEVEL[level].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Tema Específico</label>
                  <select 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  >
                    {(globalTopicsByAxis[axis] || []).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Otro">Otro Tema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Origen</label>
                  <select value={source} onChange={e => setSource(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm">
                    <option value="DEMRE">Oficial DEMRE</option>
                    <option value="Propio">Creación Propia</option>
                    <option value="Universidades">Universidades</option>
                    <option value="Otro">Otro Ensayo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Habilidad</label>
                  <select 
                    value={skill} 
                    onChange={e => setSkill(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  >
                    <option value="Resolver problemas">Resolver problemas</option>
                    <option value="Representar">Representar</option>
                    <option value="Modelar">Modelar</option>
                    <option value="Argumentar">Argumentar</option>
                    <option value={skill}>{skill}</option> {/* fallback for custom skills */}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Enunciado de la Pregunta</label>
                <RichTextEditor content={text} onChange={setText} />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Imagen de Apoyo (Opcional)</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL de la imagen (Ej. GitHub Raw)" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500" />
                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 max-h-40 rounded-lg border border-slate-800" />}
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Alternativas</label>
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="correct" 
                        checked={correctAnswer === i} 
                        onChange={() => setCorrectAnswer(i)}
                        className="w-5 h-5 accent-emerald-500"
                        title="Marcar como correcta"
                      />
                      <span className="text-slate-400 font-bold w-6">{String.fromCharCode(65 + i)})</span>
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={e => {
                          const newOpts = [...options];
                          newOpts[i] = e.target.value;
                          setOptions(newOpts);
                        }} 
                        className={`flex-1 bg-slate-950 border ${correctAnswer === i ? 'border-emerald-500/50' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500`}
                        placeholder={`Texto alternativa ${String.fromCharCode(65 + i)}...`}
                      />
                      {options.length > 2 && (
                        <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <button onClick={() => setOptions([...options, ''])} className="text-sm text-cyan-400 hover:text-cyan-300 font-bold ml-14">+ Agregar Alternativa (E)</button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-white">Solucionario (Paso a Paso)</label>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={generating}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    {generating ? 'Pensando...' : 'Generar con IA'}
                  </button>
                </div>
                <RichTextEditor content={solution} onChange={setSolution} />
                <p className="text-xs text-slate-500 mt-2">Puedes editar el solucionario generado por la IA para adaptarlo a tu estilo de enseñanza.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end gap-4 sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                <Save className="w-4 h-4" /> Guardar Pregunta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
