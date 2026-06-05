import React, { useState, useEffect } from 'react';
import { getExams, PaesExam } from '../lib/paes';
import { BookOpen, Clock, PlayCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExamCardProps {
  exam: PaesExam;
  onClick: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onClick }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition-colors group cursor-pointer" onClick={onClick}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${exam.type === 'Oficial DEMRE' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
        <BookOpen className="w-6 h-6" />
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded border ${
        exam.type === 'Oficial DEMRE' ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
        exam.type === 'Simulacro' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' :
        'bg-purple-900/30 text-purple-400 border-purple-800'
      }`}>{exam.type}</span>
    </div>
    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{exam.title}</h3>
    <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">{exam.description}</p>
    
    <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-slate-300 text-sm font-bold">
      <div className="flex gap-4">
        <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-emerald-400" /> {exam.questions.length} Preg.</span>
        <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-blue-400" /> {exam.durationMinutes} min</span>
      </div>
      <PlayCircle className="w-6 h-6 text-cyan-500 group-hover:scale-110 transition-transform" />
    </div>
  </div>
);

export default function PaesExams() {
  const [exams, setExams] = useState<PaesExam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    const data = await getExams(true); // Only published exams
    setExams(data);
    setLoading(false);
  };

  const demreExams = exams.filter(e => e.type === 'Oficial DEMRE');
  const otherExams = exams.filter(e => e.type !== 'Oficial DEMRE');

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Ensayos PAES</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Mide tus conocimientos con ensayos oficiales del DEMRE y simulacros exclusivos creados para ti.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div>
      ) : (
        <div className="space-y-12">
          {demreExams.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="text-orange-400">●</span> Ensayos Oficiales DEMRE
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demreExams.map(exam => <ExamCard key={exam.id} exam={exam} onClick={() => navigate(`/ensayos/${exam.id}`)} />)}
              </div>
            </section>
          )}

          {otherExams.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="text-cyan-400">●</span> Otros Ensayos y Simulacros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherExams.map(exam => <ExamCard key={exam.id} exam={exam} onClick={() => navigate(`/ensayos/${exam.id}`)} />)}
              </div>
            </section>
          )}
          
          {exams.length === 0 && (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
              <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">Aún no hay ensayos disponibles</h3>
              <p className="text-slate-500 mt-2">Los nuevos ensayos aparecerán aquí cuando estén publicados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
