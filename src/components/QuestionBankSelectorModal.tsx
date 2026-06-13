import React, { useState, useEffect } from 'react';
import { X, Folder, FileQuestion, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { getExams, getQuestions, PaesExam, Question } from '../lib/paes';

interface Props {
  onInsert: (question: Question) => void;
  onClose: () => void;
}

export default function QuestionBankSelectorModal({ onInsert, onClose }: Props) {
  const [exams, setExams] = useState<PaesExam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [eList, qList] = await Promise.all([getExams(), getQuestions()]);
      setExams(eList);
      setQuestions(qList);
      setLoading(false);
    };
    loadData();
  }, []);

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const examQuestions = selectedExam 
    ? questions.filter(q => selectedExam.questions.includes(q.id))
    : [];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            {selectedExamId ? (
              <>
                <button onClick={() => setSelectedExamId(null)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Folder className="w-5 h-5 text-emerald-500" /> {selectedExam?.title}
                </h2>
              </>
            ) : (
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-emerald-500" /> Banco de Preguntas (Ensayos)
              </h2>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !selectedExamId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {exams.map(exam => (
                <div 
                  key={exam.id} 
                  onClick={() => setSelectedExamId(exam.id)}
                  className="bg-slate-800 border border-slate-700 p-4 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-slate-800/80 transition-all flex items-start gap-3"
                >
                  <Folder className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-white leading-tight">{exam.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{exam.questions.length} preguntas</p>
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-500">
                  No hay ensayos creados aún en el Banco de Preguntas.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examQuestions.map((q, i) => (
                <div 
                  key={q.id}
                  className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col gap-3 relative group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">Pregunta {i + 1}</span>
                    <button 
                      onClick={() => onInsert(q)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded transition-colors"
                    >
                      Insertar al Dossier
                    </button>
                  </div>
                  
                  <div className="text-slate-300 text-sm max-h-[100px] overflow-hidden relative">
                    <div dangerouslySetInnerHTML={{ __html: q.text }} />
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-800 to-transparent"></div>
                  </div>
                  {q.imageUrl && <div className="text-xs text-slate-400 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Contiene imagen</div>}
                </div>
              ))}
              {examQuestions.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-500">
                  Este ensayo no tiene preguntas asociadas.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
