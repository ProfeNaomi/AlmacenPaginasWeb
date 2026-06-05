import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Bot, Save, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Question, getQuestions, createQuestion, updateQuestion, deleteQuestion, QuestionAxis, QuestionSource, QuestionLevel } from '../../lib/paes';
import { generateMathSolution, hasAIConfigured } from '../../lib/ai';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  const AXIS_BY_LEVEL: Record<QuestionLevel, QuestionAxis[]> = {
    'Secundaria': ['Números', 'Álgebra y Funciones', 'Geometría', 'Probabilidad y Estadística'],
    'Universitario': ['Cálculo', 'Álgebra', 'Lógica', 'Geometría', 'Probabilidad y Estadística']
  };

  const TOPICS_BY_AXIS: Record<string, string[]> = {
    'Números': ['Conjuntos Numéricos', 'Porcentajes', 'Potencias', 'Raíces', 'Logaritmos'],
    'Álgebra y Funciones': ['Expresiones Algebraicas', 'Ecuaciones', 'Inecuaciones', 'Sistemas de Ecuaciones', 'Funciones (Lineal y Afín)', 'Función Cuadrática'],
    'Geometría': ['Figuras Geométricas', 'Transformaciones Isométricas', 'Semejanza y Proporcionalidad', 'Teorema de Pitágoras', 'Cuerpos Geométricos', 'Geometría Analítica', 'Cálculo Vectorial'],
    'Probabilidad y Estadística': ['Estadística Descriptiva', 'Técnicas de Conteo', 'Probabilidades', 'Inferencia Estadística', 'Distribuciones de Probabilidad'],
    'Cálculo': ['Límites', 'Derivadas', 'Integrales', 'Ecuaciones Diferenciales', 'Series'],
    'Álgebra': ['Álgebra Lineal', 'Matrices', 'Espacios Vectoriales', 'Polinomios'],
    'Lógica': ['Lógica Proposicional', 'Teoría de Conjuntos'],
  };
  
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const data = await getQuestions();
    setQuestions(data);
    setLoading(false);
  };

  const resetForm = () => {
    setText('');
    setImageUrl('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setSolution('');
    setLevel('Secundaria');
    setAxis('Números');
    setSource('Propio');
    setTopic(TOPICS_BY_AXIS['Números'][0] || '');
    setSkill('Resolver problemas');
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setText(q.text);
    setImageUrl(q.imageUrl || '');
    setOptions(q.options);
    setCorrectAnswer(q.correctAnswer);
    setSolution(q.solution);
    setLevel(q.level || 'Secundaria');
    setAxis(q.axis);
    setSource(q.source);
    setTopic(q.topic);
    setSkill(q.skill);
    setEditingId(q.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      text,
      imageUrl,
      options,
      correctAnswer,
      options,
      correctAnswer,
      solution,
      level,
      axis,
      source,
      topic,
      skill
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Banco de Preguntas PAES</h1>
          <p className="text-slate-400">Gestiona tus ejercicios y solucionarios con Inteligencia Artificial.</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/20"
        >
          <Plus className="w-5 h-5" /> Nueva Pregunta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map(q => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-xl group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(q)} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                  Editar
                </button>
                <button onClick={() => handleDelete(q.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 pr-20">
                <span className={`text-xs font-bold px-2 py-1 rounded border ${q.level === 'Universitario' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-pink-900/30 text-pink-400 border-pink-800'}`}>{q.level || 'Secundaria'}</span>
                <span className="text-xs font-bold bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-800">{q.axis}</span>
                <span className="text-xs font-bold bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-800">{q.source}</span>
                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">{q.topic}</span>
              </div>
              
              <div 
                className="text-slate-200 text-sm line-clamp-3 mb-4 prose prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: q.text }}
              />
              
              <div className="text-xs text-emerald-400 font-bold border-t border-slate-800 pt-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Alternativa Correcta: {String.fromCharCode(65 + q.correctAnswer)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Pregunta' : 'Nueva Pregunta PAES'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Nivel</label>
                  <select 
                    value={level} 
                    onChange={e => {
                      const newLevel = e.target.value as QuestionLevel;
                      setLevel(newLevel);
                      const newAxis = AXIS_BY_LEVEL[newLevel][0];
                      setAxis(newAxis);
                      setTopic(TOPICS_BY_AXIS[newAxis][0] || '');
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
                      setTopic(TOPICS_BY_AXIS[newAxis]?.[0] || '');
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
                    {(TOPICS_BY_AXIS[axis] || []).map(t => (
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
                  <input type="text" value={skill} onChange={e => setSkill(e.target.value)} placeholder="Ej. Resolver" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm" />
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

// Missing icon imports fix: CheckCircle2, X
import { CheckCircle2, X } from 'lucide-react';
