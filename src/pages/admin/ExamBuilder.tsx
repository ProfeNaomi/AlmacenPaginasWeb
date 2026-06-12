import React, { useState, useEffect } from 'react';
import { getQuestions, getExams, createExam, updateExam, deleteExam, Question, PaesExam, QuestionLevel, QuestionAxis } from '../../lib/paes';
import { Plus, Save, Trash2, Edit, ChevronDown, ChevronRight, CheckSquare, Square, X, AlertCircle, Folder, Printer, Wand2 } from 'lucide-react';

export default function ExamBuilder() {
  const [exams, setExams] = useState<PaesExam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto-Gen Modal State
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  const [autoLevel, setAutoLevel] = useState<QuestionLevel>('Secundaria');
  const [autoCount, setAutoCount] = useState<number>(65);
  const [autoTime, setAutoTime] = useState<number>(140);
  const [autoSelectedTopics, setAutoSelectedTopics] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Oficial DEMRE' | 'Simulacro' | 'Temático'>('Simulacro');
  const [durationMinutes, setDurationMinutes] = useState(140);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eData, qData] = await Promise.all([getExams(), getQuestions()]);
    setExams(eData);
    setQuestions(qData);
    setLoading(false);
  };

  const openNew = () => {
    setTitle('');
    setDescription('');
    setType('Simulacro');
    setDurationMinutes(140);
    setIsPublished(false);
    setSelectedQuestions([]);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (e: PaesExam) => {
    setTitle(e.title);
    setDescription(e.description);
    setType(e.type);
    setDurationMinutes(e.durationMinutes);
    setIsPublished(e.isPublished);
    setSelectedQuestions(e.questions);
    setEditingId(e.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title || selectedQuestions.length === 0) {
      alert("El ensayo debe tener un título y al menos una pregunta.");
      return;
    }

    const data = { title, description, type, durationMinutes, isPublished, questions: selectedQuestions };
    
    if (editingId) {
      await updateExam(editingId, data);
    } else {
      await createExam(data);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este ensayo?")) {
      await deleteExam(id);
      loadData();
    }
  };

  const toggleQuestion = (qId: string) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, qId]);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    const groupName = `${q.level || 'Secundaria'} > ${q.axis}`;
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  const printExam = (id: string) => {
    window.open(`/exam/${id}?print=true`, '_blank');
  };

  // --- Auto Generator Logic ---
  const globalTopicsByAxis = React.useMemo(() => {
    const topics: Record<string, Set<string>> = {};
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

  const toggleAutoTopic = (topic: string) => {
    const next = new Set(autoSelectedTopics);
    if (next.has(topic)) next.delete(topic);
    else next.add(topic);
    setAutoSelectedTopics(next);
  };

  const toggleAutoAxis = (axis: string) => {
    const topicsInAxis = globalTopicsByAxis[axis] || [];
    const next = new Set(autoSelectedTopics);
    const allSelected = topicsInAxis.every(t => next.has(t));
    if (allSelected) {
      topicsInAxis.forEach(t => next.delete(t));
    } else {
      topicsInAxis.forEach(t => next.add(t));
    }
    setAutoSelectedTopics(next);
  };

  const handleGenerateAuto = () => {
    if (autoSelectedTopics.size === 0) {
      alert("Selecciona al menos un tema.");
      return;
    }

    // Filter questions by level and selected topics
    const pool = questions.filter(q => q.level === autoLevel && autoSelectedTopics.has(q.topic));
    
    if (pool.length < autoCount) {
      alert(`Solo hay ${pool.length} preguntas disponibles con estos temas. Se añadirán todas.`);
    }

    // Shuffle and pick
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, autoCount).map(q => q.id);

    if (picked.length === 0) {
      alert("No se encontraron preguntas.");
      return;
    }

    setTitle(`Ensayo Temático: ${Array.from(autoSelectedTopics).slice(0, 2).join(', ')}${autoSelectedTopics.size > 2 ? '...' : ''}`);
    setDescription(`Generado automáticamente con ${picked.length} preguntas.`);
    setType('Temático');
    setDurationMinutes(autoTime);
    setSelectedQuestions(picked);
    
    setIsAutoOpen(false);
    setIsModalOpen(true); // Open the manual editor to review/save
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Creador de Ensayos PAES</h1>
          <p className="text-slate-400">Arma ensayos seleccionando preguntas del banco o usa el generador automático.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAutoOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20">
            <Wand2 className="w-5 h-5" /> Auto-Generar
          </button>
          <button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20">
            <Plus className="w-5 h-5" /> Nuevo Ensayo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(e => (
          <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative group hover:border-slate-700 transition-colors">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => printExam(e.id)} className="p-2 bg-slate-800 hover:bg-emerald-600 rounded-lg text-slate-300 hover:text-white transition-colors" title="Exportar a PDF">
                <Printer className="w-4 h-4"/>
              </button>
              <button onClick={() => openEdit(e)} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Edit className="w-4 h-4"/>
              </button>
              <button onClick={() => handleDelete(e.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${
                e.type === 'Oficial DEMRE' ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                e.type === 'Simulacro' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' :
                'bg-purple-900/30 text-purple-400 border-purple-800'
              }`}>{e.type}</span>
              {e.isPublished ? 
                <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded">Publicado</span> :
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Borrador</span>
              }
            </div>
            <h3 className="text-xl font-bold text-white mb-1 pr-24">{e.title}</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{e.description}</p>
            <div className="text-slate-500 text-sm font-bold flex items-center justify-between">
              <span>{e.questions?.length || 0} Preguntas</span>
              <span>{e.durationMinutes} min</span>
            </div>
          </div>
        ))}
      </div>

      {/* Auto Generator Modal */}
      {isAutoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Wand2 className="w-6 h-6 text-purple-500"/> Configurar Ensayo Inteligente</h2>
              <button onClick={() => setIsAutoOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Config */}
              <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 overflow-y-auto">
                <h3 className="text-lg font-bold text-white mb-4">Cantidad y Tiempo</h3>
                
                <div className="space-y-3 mb-8">
                  {[
                    { q: 65, m: 140 },
                    { q: 32, m: 70 },
                    { q: 16, m: 35 }
                  ].map(preset => (
                    <label key={preset.q} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${autoCount === preset.q ? 'border-purple-500 bg-purple-900/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                      <input type="radio" name="preset" checked={autoCount === preset.q} onChange={() => { setAutoCount(preset.q); setAutoTime(preset.m); }} className="w-4 h-4 accent-purple-500" />
                      <div>
                        <div className="font-bold text-white">{preset.q} preguntas</div>
                        <div className="text-sm text-slate-400">{preset.m} minutos</div>
                      </div>
                    </label>
                  ))}
                  
                  {/* Custom Option */}
                  <label className={`flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${![65, 32, 16].includes(autoCount) ? 'border-purple-500 bg-purple-900/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="preset" checked={![65, 32, 16].includes(autoCount)} onChange={() => { setAutoCount(10); setAutoTime(20); }} className="w-4 h-4 accent-purple-500" />
                      <span className="font-bold text-white">Personalizado</span>
                    </div>
                    {![65, 32, 16].includes(autoCount) && (
                      <div className="flex gap-2 pl-7">
                        <div className="flex-1">
                          <label className="text-xs text-slate-400">Preguntas</label>
                          <input type="number" value={autoCount} onChange={e => setAutoCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded text-white p-2 text-sm focus:border-purple-500 outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-slate-400">Minutos</label>
                          <input type="number" value={autoTime} onChange={e => setAutoTime(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded text-white p-2 text-sm focus:border-purple-500 outline-none" />
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <h3 className="text-lg font-bold text-white mb-4">Nivel</h3>
                <select value={autoLevel} onChange={e => setAutoLevel(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none">
                  <option value="Secundaria">Competencia Matemática M1/M2</option>
                  <option value="Universitario">Universitario</option>
                </select>
              </div>

              {/* Right Column: Personalizar */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-slate-900">
                <h3 className="text-lg font-bold text-white mb-2">Personalizar Temas</h3>
                <p className="text-sm text-slate-400 mb-6">Selecciona las categorías para limitar los contenidos de la evaluación.</p>
                
                <div className="space-y-4">
                  {Object.entries(globalTopicsByAxis).map(([axis, topics]) => {
                    if (topics.length === 0) return null;
                    const topicsInAxis = globalTopicsByAxis[axis] || [];
                    const selectedCount = topicsInAxis.filter(t => autoSelectedTopics.has(t)).length;
                    const allSelected = selectedCount === topicsInAxis.length;
                    const someSelected = selectedCount > 0 && !allSelected;

                    return (
                      <div key={axis} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                        <div className="flex items-center gap-3 p-4 bg-slate-800/40">
                          <input 
                            type="checkbox" 
                            checked={allSelected} 
                            ref={input => { if (input) input.indeterminate = someSelected; }}
                            onChange={() => toggleAutoAxis(axis)} 
                            className="w-5 h-5 accent-purple-500 rounded cursor-pointer" 
                          />
                          <span className="font-bold text-white flex-1">{axis}</span>
                          <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-1 rounded">{selectedCount} / {topics.length}</span>
                        </div>
                        <div className="p-2 space-y-1">
                          {topics.map(t => (
                            <label key={t} className="flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors ml-4 border border-transparent hover:border-slate-700">
                              <input 
                                type="checkbox" 
                                checked={autoSelectedTopics.has(t)} 
                                onChange={() => toggleAutoTopic(t)} 
                                className="w-4 h-4 accent-purple-500 rounded cursor-pointer" 
                              />
                              <span className="text-slate-300 text-sm">{t}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end gap-4">
              <button onClick={() => setIsAutoOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleGenerateAuto} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5" /> Crear Ensayo ({autoCount} Preguntas)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-700 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Ensayo' : 'Revisar Nuevo Ensayo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Título del Ensayo</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500" placeholder="Ej. Ensayo M1 de Invierno..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Tipo</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500">
                    <option value="Simulacro">Simulacro General</option>
                    <option value="Oficial DEMRE">Oficial DEMRE</option>
                    <option value="Temático">Ensayo Temático</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Duración (Minutos)</label>
                  <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Descripción Corta</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 min-h-[80px]" />
              </div>

              <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <input type="checkbox" id="pub" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                <label htmlFor="pub" className="text-white font-bold cursor-pointer">Publicar Ensayo</label>
                <span className="text-slate-400 text-sm ml-auto">Los estudiantes podrán verlo.</span>
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                  Preguntas Incluidas
                  <span className="text-cyan-400 bg-cyan-900/30 px-3 py-1 rounded-full text-sm">{selectedQuestions.length} seleccionadas</span>
                </h3>
                
                {questions.length === 0 ? (
                  <div className="bg-amber-900/20 border border-amber-800/50 p-4 rounded-xl text-amber-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> No tienes preguntas en tu banco. Ve a "Banco de Preguntas" para crear algunas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedQuestions).sort().map(([groupName, groupQs]) => {
                      const selectedInGroup = groupQs.filter(q => selectedQuestions.includes(q.id)).length;
                      if (selectedInGroup === 0 && !expandedGroups.includes(groupName)) {
                        // Collapse groups with no selections by default to save space
                        return (
                          <div key={groupName} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 opacity-70">
                            <button onClick={() => toggleGroup(groupName)} className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800 transition-colors">
                              <div className="flex items-center gap-3">
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                                <Folder className="w-5 h-5 text-slate-500" />
                                <span className="font-bold text-slate-400 text-sm">{groupName}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{groupQs.length} items</span>
                            </button>
                          </div>
                        );
                      }
                      
                      const isExpanded = expandedGroups.includes(groupName) || selectedInGroup > 0;

                      return (
                        <div key={groupName} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
                          <button 
                            onClick={() => toggleGroup(groupName)}
                            className="w-full flex items-center justify-between p-4 bg-slate-800/70 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="w-5 h-5 text-cyan-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                              <Folder className="w-5 h-5 text-cyan-500" />
                              <span className="font-bold text-white text-sm">{groupName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                              <span className="text-slate-400">{groupQs.length} items</span>
                              {selectedInGroup > 0 && <span className="bg-cyan-500 text-slate-900 px-2 py-1 rounded-full">{selectedInGroup} seleccionadas</span>}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="p-3 bg-slate-950 space-y-2 max-h-[400px] overflow-y-auto">
                              {groupQs.map(q => (
                                <div 
                                  key={q.id} 
                                  onClick={() => toggleQuestion(q.id)}
                                  className={`p-3 rounded-xl border cursor-pointer flex gap-4 transition-colors ${
                                    selectedQuestions.includes(q.id) 
                                      ? 'bg-cyan-900/20 border-cyan-500/50' 
                                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="mt-1">
                                    {selectedQuestions.includes(q.id) ? <CheckSquare className="w-5 h-5 text-cyan-400" /> : <Square className="w-5 h-5 text-slate-600" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex gap-2 mb-2 items-center">
                                      <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{q.topic}</span>
                                      <span className="text-xs font-bold bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-800">{q.source}</span>
                                      {q.questionNumber && <span className="text-xs text-slate-500 font-bold ml-auto">Nº {q.questionNumber}</span>}
                                    </div>
                                    <div className="text-sm text-slate-300 line-clamp-2 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{__html: q.text}} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900">
              <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Guardar Ensayo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
