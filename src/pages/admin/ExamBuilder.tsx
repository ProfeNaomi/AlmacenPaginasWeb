import React, { useState, useEffect } from 'react';
import { getQuestions, getExams, createExam, updateExam, deleteExam, Question, PaesExam } from '../../lib/paes';
import { Plus, Save, Trash2, Edit, ChevronDown, ChevronRight, CheckSquare, Square, X, AlertCircle, Folder } from 'lucide-react';

export default function ExamBuilder() {
  const [exams, setExams] = useState<PaesExam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Creador de Ensayos PAES</h1>
          <p className="text-slate-400">Arma ensayos seleccionando preguntas del banco.</p>
        </div>
        <button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Nuevo Ensayo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(e => (
          <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative group hover:border-slate-700 transition-colors">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(e)} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg text-slate-300"><Edit className="w-4 h-4"/></button>
              <button onClick={() => handleDelete(e.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-300"><Trash2 className="w-4 h-4"/></button>
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
            <h3 className="text-xl font-bold text-white mb-1">{e.title}</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{e.description}</p>
            <div className="text-slate-500 text-sm font-bold flex items-center justify-between">
              <span>{e.questions.length} Preguntas</span>
              <span>{e.durationMinutes} min</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-700 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Ensayo' : 'Armar Nuevo Ensayo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
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
                  Selección de Preguntas
                  <span className="text-cyan-400 bg-cyan-900/30 px-3 py-1 rounded-full text-sm">{selectedQuestions.length} seleccionadas</span>
                </h3>
                
                {questions.length === 0 ? (
                  <div className="bg-amber-900/20 border border-amber-800/50 p-4 rounded-xl text-amber-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> No tienes preguntas en tu banco. Ve a "Banco de Preguntas" para crear algunas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedQuestions).sort().map(([groupName, groupQs]) => {
                      const isExpanded = expandedGroups.includes(groupName);
                      const selectedInGroup = groupQs.filter(q => selectedQuestions.includes(q.id)).length;
                      
                      return (
                        <div key={groupName} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                          <button 
                            onClick={() => toggleGroup(groupName)}
                            className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                              <Folder className="w-5 h-5 text-cyan-500" />
                              <span className="font-bold text-slate-200 text-sm">{groupName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                              <span className="text-slate-500">{groupQs.length} items</span>
                              {selectedInGroup > 0 && <span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">{selectedInGroup} seleccionadas</span>}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="p-3 bg-slate-950 space-y-2">
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
                                    <div className="flex gap-2 mb-2">
                                      <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{q.topic}</span>
                                      <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{q.source}</span>
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
