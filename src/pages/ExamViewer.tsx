import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getExamById, getQuestionById, PaesExam, Question } from '../lib/paes';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, ArrowRight, CheckCircle2, XCircle, Bot, Trophy, Printer } from 'lucide-react';
import 'katex/dist/katex.min.css';

export default function ExamViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get('print') === 'true';
  const { profile } = useAuth();

  const [exam, setExam] = useState<PaesExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Exam State
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (id) loadExam(id);
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && !finished && timeLeft > 0 && !isPrintMode) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && started && !finished && !isPrintMode) {
      finishExam();
    }
    return () => clearInterval(timer);
  }, [started, finished, timeLeft, isPrintMode]);

  useEffect(() => {
    if (isPrintMode && !loading && questions.length > 0) {
      // Small delay to allow images and styles to load before print dialog
      const timer = setTimeout(() => {
        window.print();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPrintMode, loading, questions]);

  const loadExam = async (examId: string) => {
    setLoading(true);
    const eData = await getExamById(examId);
    if (eData) {
      setExam(eData);
      setTimeLeft(eData.durationMinutes * 60);
      
      const qPromises = eData.questions.map(qId => getQuestionById(qId));
      const qResults = await Promise.all(qPromises);
      // Sort questions if they have a questionNumber
      const fetchedQuestions = qResults.filter(q => q !== null) as Question[];
      fetchedQuestions.sort((a, b) => {
        const numA = parseInt(a.questionNumber || '999') || 999;
        const numB = parseInt(b.questionNumber || '999') || 999;
        return numA - numB;
      });
      setQuestions(fetchedQuestions);
    }
    setLoading(false);
  };

  const startExam = () => setStarted(true);
  
  const finishExam = () => {
    if(confirm('¿Estás seguro de que quieres finalizar el ensayo?')) {
      setFinished(true);
    }
  };

  const selectAnswer = (qId: string, index: number) => {
    setAnswers({ ...answers, [qId]: index });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div>;
  if (!exam) return <div className="text-center text-white py-20">Ensayo no encontrado</div>;

  // --- Print Mode Screen (PDF Export) ---
  if (isPrintMode) {
    return (
      <div className="bg-white min-h-screen text-black font-sans print:m-0 print:p-0" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {/* Floating Print Button (hidden in print) */}
        <button 
          onClick={() => window.print()}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-colors z-50 print:hidden flex items-center gap-2 font-bold"
        >
          <Printer className="w-6 h-6" /> Imprimir / PDF
        </button>

        {/* Cover Page */}
        <div className="p-8 max-w-4xl mx-auto break-after-page pt-20 flex flex-col min-h-[80vh] justify-center">
          <div className="text-center mb-16 border-b-4 border-black pb-12">
            <h1 className="text-5xl font-black mb-6 uppercase tracking-tighter leading-tight text-black">{exam.title}</h1>
            <p className="text-2xl uppercase tracking-widest font-bold text-black">{exam.type}</p>
          </div>
          <div className="space-y-6 text-xl border-4 border-black p-12 rounded-2xl font-medium max-w-2xl mx-auto w-full">
            <div className="flex justify-between border-b-2 border-gray-300 pb-4 text-black">
              <strong>TIEMPO ASIGNADO:</strong> 
              <span>{exam.durationMinutes} minutos</span>
            </div>
            <div className="flex justify-between border-b-2 border-gray-300 pb-4">
              <strong>CANTIDAD DE PREGUNTAS:</strong> 
              <span>{questions.length}</span>
            </div>
            {exam.description && (
              <p className="mt-8 text-base text-gray-600 italic text-center leading-relaxed">
                {exam.description}
              </p>
            )}
          </div>
          <div className="mt-32 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
            Generado automáticamente por Plataforma PAES
          </div>
        </div>

        {/* Questions Pages */}
        <div className="max-w-4xl mx-auto p-8 print:p-0">
          {questions.map((q, i) => (
            <div key={q.id} className="mb-8 print:mb-6 break-inside-avoid relative" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex gap-4">
                {/* Question Number */}
                <div className="font-black text-xl min-w-[2rem] text-black">
                  {q.questionNumber || (i + 1)}.
                </div>
                
                {/* Question Content */}
                <div className="flex-1">
                  <div className="prose prose-slate prose-img:max-w-full prose-p:my-0.5 prose-strong:font-bold text-[15px] print:text-[14px] mb-3 text-black leading-snug text-justify" dangerouslySetInnerHTML={{__html: q.text}} />
                  
                  {q.imageUrl && (
                    <div className="mb-4 mt-2 flex justify-center">
                      <img src={q.imageUrl} alt="Apoyo" className="max-w-[70%] print:max-w-[60%] border border-gray-300 rounded" />
                    </div>
                  )}
                  
                  {/* Options List */}
                  <div className="space-y-2 mt-3 ml-1">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className="flex gap-3 text-[15px] print:text-[14px] items-start text-black">
                        <span className="font-bold">{String.fromCharCode(65 + idx)})</span>
                        <div dangerouslySetInnerHTML={{__html: opt}} className="flex-1 prose prose-slate prose-p:m-0 text-black" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Separator line for print clarity */}
              <div className="w-16 h-px bg-gray-300 mt-6 mx-auto mb-2 print:mb-4"></div>
            </div>
          ))}
          
          <div className="text-center font-bold text-gray-400 tracking-widest mt-12 pb-12">
            FIN DEL ENSAYO
          </div>
        </div>
      </div>
    );
  }

  // --- Start Screen ---
  if (!started) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 pt-12 text-center">
        <button onClick={() => navigate('/ensayos')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a Ensayos
        </button>
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-cyan-400 font-bold bg-cyan-900/30 px-3 py-1 rounded-full text-sm border border-cyan-800">{exam.type}</span>
          {profile?.role === 'admin' && (
            <button onClick={() => window.open(`/ensayos/${id}?print=true`, '_blank')} className="text-slate-400 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors text-sm border border-slate-700 px-3 py-1 rounded-full hover:border-emerald-500/50">
              <Printer className="w-4 h-4" /> Exportar PDF
            </button>
          )}
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-4">{exam.title}</h1>
        <p className="text-xl text-slate-400 mb-8">{exam.description}</p>
        
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="block text-4xl font-bold text-emerald-400 mb-2">{questions.length}</span>
            <span className="text-slate-400 font-bold">Preguntas</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="block text-4xl font-bold text-blue-400 mb-2">{exam.durationMinutes}'</span>
            <span className="text-slate-400 font-bold">Minutos</span>
          </div>
        </div>

        <button onClick={startExam} className="bg-cyan-600 hover:bg-cyan-500 text-white px-12 py-4 rounded-full font-bold text-xl shadow-[0_0_30px_rgba(8,145,178,0.4)] hover:shadow-[0_0_40px_rgba(8,145,178,0.6)] transition-all transform hover:scale-105">
          Comenzar Ensayo
        </button>
      </div>
    );
  }

  // --- Results Screen ---
  if (finished) {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });
    
    // Simple mock calculation for PAES score (100 to 1000)
    // base 100 + (correct/total)*900. Just an approximation.
    const score = Math.round(100 + (correctCount / questions.length) * 900);

    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 pt-8">
        <button onClick={() => navigate('/ensayos')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a Ensayos
        </button>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-display font-bold text-white mb-2">¡Ensayo Finalizado!</h2>
          <div className="flex justify-center gap-8 mt-8">
            <div>
              <span className="block text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1">{score}</span>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-sm">Puntos Estimados</span>
            </div>
            <div className="w-px bg-slate-800"></div>
            <div>
              <span className="block text-5xl font-black text-emerald-400 mb-1">{correctCount}<span className="text-2xl text-slate-500">/{questions.length}</span></span>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-sm">Respuestas Correctas</span>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-6">Revisión de Respuestas y Solucionario</h3>
        <div className="space-y-8">
          {questions.map((q, i) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            const didAnswer = answers[q.id] !== undefined;
            return (
              <div key={q.id} className={`bg-slate-900 border ${isCorrect ? 'border-emerald-900/50' : 'border-red-900/50'} rounded-2xl overflow-hidden`}>
                <div className={`px-6 py-3 flex justify-between items-center ${isCorrect ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400"/> : <XCircle className="w-5 h-5 text-red-400"/>}
                    Pregunta {q.questionNumber || (i + 1)}
                  </h4>
                  <span className="text-sm font-bold text-slate-400">{q.axis} - {q.topic}</span>
                </div>
                
                <div className="p-6">
                  <div className="prose prose-invert prose-slate max-w-none mb-6" dangerouslySetInnerHTML={{__html: q.text}} />
                  {q.imageUrl && <img src={q.imageUrl} alt="Pregunta" className="mb-6 max-h-64 rounded-lg" />}
                  
                  <div className="space-y-2 mb-8">
                    {q.options.map((opt, idx) => {
                      const isSelected = answers[q.id] === idx;
                      const isActuallyCorrect = q.correctAnswer === idx;
                      
                      let optClass = "border-slate-800 bg-slate-950 text-slate-400";
                      if (isActuallyCorrect) optClass = "border-emerald-500/50 bg-emerald-900/20 text-emerald-300";
                      else if (isSelected && !isActuallyCorrect) optClass = "border-red-500/50 bg-red-900/20 text-red-300";

                      return (
                        <div key={idx} className={`p-4 rounded-xl border flex gap-3 ${optClass}`}>
                          <span className="font-bold">{String.fromCharCode(65 + idx)})</span>
                          <span dangerouslySetInnerHTML={{__html: opt}} />
                          {isActuallyCorrect && <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500" />}
                          {isSelected && !isActuallyCorrect && <XCircle className="w-5 h-5 ml-auto text-red-500" />}
                        </div>
                      );
                    })}
                    {!didAnswer && <p className="text-red-400 text-sm font-bold mt-2">No respondiste esta pregunta.</p>}
                  </div>

                  {q.solution && (
                    <div className="bg-slate-950 border border-purple-900/50 rounded-xl p-5 relative mt-4">
                      <div className="absolute -top-3 left-4 bg-slate-900 px-2 flex items-center gap-2 text-purple-400 font-bold text-sm border border-purple-900/50 rounded-full">
                        <Bot className="w-4 h-4" /> Solucionario IA
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-slate-300 mt-2" dangerouslySetInnerHTML={{__html: q.solution}} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Active Exam Screen ---
  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Exam Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-white hidden sm:block">{exam.title}</span>
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-bold border border-slate-700">
            Pregunta {q.questionNumber || (currentIndex + 1)} de {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 font-display font-bold text-xl ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
            <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
          </div>
          <button onClick={finishExam} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm">
            Finalizar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Question Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-black font-sans" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 mb-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{q.axis}</span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{q.topic}</span>
            </div>
            
            <div className="prose prose-slate prose-img:mx-auto prose-img:max-w-full prose-p:leading-relaxed prose-p:my-2 prose-a:text-blue-600 prose-strong:font-bold text-[15px] mb-8" dangerouslySetInnerHTML={{__html: q.text}} />
            
            {q.imageUrl && (
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block flex justify-center w-full">
                <img src={q.imageUrl} alt="Material de apoyo" className="max-w-full rounded-lg max-h-[400px]" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Options */}
        <div className="w-full md:w-96 bg-slate-50 border-l border-slate-200 p-6 flex flex-col overflow-y-auto shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-wider text-sm">Selecciona tu respuesta:</h3>
          <div className="space-y-4 flex-1">
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(q.id, idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 text-[15px] ${
                    selected 
                      ? 'border-cyan-500 bg-cyan-50 text-slate-900 shadow-[0_0_15px_rgba(8,145,178,0.1)]' 
                      : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50'
                  }`}
                >
                  <span className={`font-bold mt-0.5 ${selected ? 'text-cyan-600' : 'text-slate-400'}`}>
                    {String.fromCharCode(65 + idx)})
                  </span>
                  <div className="flex-1 prose prose-p:m-0" dangerouslySetInnerHTML={{__html: opt}} />
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-800 mt-6 gap-4">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-4 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => {
                if (isLast) finishExam();
                else setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
              }}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold transition-all text-lg ${
                isLast 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isLast ? 'Finalizar Ensayo' : 'Siguiente'} {!isLast && <ArrowRight className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
