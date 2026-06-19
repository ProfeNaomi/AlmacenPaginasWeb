import React, { useState } from 'react';
import { X, Plus, Calendar, Save, Trash2, Clock, CheckCircle } from 'lucide-react';
import { generateClassDates } from '../../lib/plannerUtils';

interface ClassDetail {
  id: string;
  fecha: Date;
  tipo: 'Normal' | 'Evaluación' | 'Retroalimentación';
  // Normal/Retro
  inicio: string;
  tiempoInicio: number;
  desarrollo: string;
  tiempoDesarrollo: number;
  cierre: string;
  tiempoCierre: number;
  // Evaluación
  tipoEvaluacion: string;
  contenidoEvaluacion: string;
  tiempoTotal: number;
}

interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowId: string;
  weekStart: Date;
  weekEnd: Date;
  initialClasses: ClassDetail[];
  onSave: (rowId: string, classes: ClassDetail[]) => void;
  defaultClassCount?: number;
}

export default function ClassDetailModal({ isOpen, onClose, rowId, weekStart, weekEnd, initialClasses, onSave, defaultClassCount = 3 }: ClassDetailModalProps) {
  const [classes, setClasses] = useState<ClassDetail[]>(initialClasses);
  const [classCount, setClassCount] = useState(initialClasses.length || defaultClassCount);
  const [omitWeekends, setOmitWeekends] = useState(true);

  if (!isOpen) return null;

  const handleGenerateDates = () => {
    const dates = generateClassDates(weekStart, weekEnd, classCount, omitWeekends);
    const newClasses: ClassDetail[] = dates.map((date, idx) => ({
      id: Math.random().toString(36).substr(2, 9),
      fecha: date,
      tipo: 'Normal',
      inicio: '',
      tiempoInicio: 15,
      desarrollo: '',
      tiempoDesarrollo: 60,
      cierre: '',
      tiempoCierre: 15,
      tipoEvaluacion: '',
      contenidoEvaluacion: '',
      tiempoTotal: 90
    }));
    setClasses(newClasses);
  };

  const updateClass = (id: string, field: keyof ClassDetail, value: any) => {
    setClasses(classes.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addClass = () => {
    setClasses([...classes, {
      id: Math.random().toString(36).substr(2, 9),
      fecha: new Date(weekStart),
      tipo: 'Normal',
      inicio: '',
      tiempoInicio: 15,
      desarrollo: '',
      tiempoDesarrollo: 60,
      cierre: '',
      tiempoCierre: 15,
      tipoEvaluacion: '',
      contenidoEvaluacion: '',
      tiempoTotal: 90
    }]);
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              Planificación Clase a Clase
            </h2>
            <p className="text-slate-400 text-sm mt-1">Desglosa los momentos de la clase y los tiempos estimados</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Cant. Clases</label>
            <input 
              type="number" 
              value={classCount} 
              onChange={(e) => setClassCount(parseInt(e.target.value) || 1)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white w-24"
              min="1"
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <input 
              type="checkbox" 
              id="omitWeekends" 
              checked={omitWeekends} 
              onChange={(e) => setOmitWeekends(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500"
            />
            <label htmlFor="omitWeekends" className="text-sm text-slate-300">Omitir fines de semana</label>
          </div>
          <button 
            onClick={handleGenerateDates}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium text-sm"
          >
            Autogenerar Fechas
          </button>
          
          <button 
            onClick={addClass}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-xl transition-colors font-medium text-sm ml-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar Clase Manual
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
          {classes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Usa el botón de autogenerar o agrega clases manualmente.
            </div>
          ) : (
            classes.map((c, index) => {
              const totalTime = c.tipo === 'Evaluación' 
                ? c.tiempoTotal 
                : (Number(c.tiempoInicio) + Number(c.tiempoDesarrollo) + Number(c.tiempoCierre));

              return (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative group shadow-sm">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeClass(c.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex gap-4 mb-4 items-start">
                    <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex flex-col items-center justify-center border border-cyan-500/20 shrink-0">
                      <span className="text-[10px] text-cyan-500 font-bold uppercase">Clase</span>
                      <span className="text-xl text-cyan-400 font-bold leading-none">{index + 1}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Fecha</label>
                        <input 
                          type="date" 
                          value={c.fecha instanceof Date && !isNaN(c.fecha.getTime()) ? c.fecha.toISOString().split('T')[0] : ''}
                          onChange={(e) => updateClass(c.id, 'fecha', new Date(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Tipo de Clase</label>
                        <select 
                          value={c.tipo}
                          onChange={(e) => updateClass(c.id, 'tipo', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Retroalimentación">Retroalimentación</option>
                          <option value="Evaluación">Evaluación</option>
                        </select>
                      </div>
                      <div className="hidden md:flex flex-col justify-end">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 flex items-center justify-center gap-2 h-[38px]">
                          <Clock className="w-4 h-4 text-cyan-500" />
                          <span>Total: <b>{totalTime}</b> min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {c.tipo === 'Evaluación' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                        <label className="block text-xs font-bold text-purple-400 mb-2">Detalles de la Evaluación</label>
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tipo (Formativa, Sumativa, etc)</span>
                            <input 
                              type="text" 
                              value={c.tipoEvaluacion}
                              onChange={(e) => updateClass(c.id, 'tipoEvaluacion', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-purple-500/50"
                              placeholder="Ej: Prueba Sumativa Escrita"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Contenidos a Evaluar</span>
                            <textarea 
                              value={c.contenidoEvaluacion}
                              onChange={(e) => updateClass(c.id, 'contenidoEvaluacion', e.target.value)}
                              className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 resize-none focus:border-purple-500/50"
                              placeholder="Temas, unidades o habilidades a medir..."
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                         <label className="block text-xs font-bold text-purple-400 mb-2">Tiempos</label>
                         <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Duración de Evaluación (min)</span>
                            <input 
                              type="number" 
                              value={c.tiempoTotal}
                              onChange={(e) => updateClass(c.id, 'tiempoTotal', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-purple-500/50"
                            />
                          </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
                      <div className="bg-emerald-900/5 border border-emerald-500/10 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-emerald-400">Inicio (Activación)</label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={c.tiempoInicio}
                              onChange={(e) => updateClass(c.id, 'tiempoInicio', parseInt(e.target.value) || 0)}
                              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-emerald-400 focus:border-emerald-500/50 outline-none"
                            />
                            <span className="text-[10px] text-slate-500">min</span>
                          </div>
                        </div>
                        <textarea 
                          value={c.inicio}
                          onChange={(e) => updateClass(c.id, 'inicio', e.target.value)}
                          className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 resize-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                          placeholder="Saludo, objetivo, activación..."
                        />
                      </div>
                      <div className="bg-blue-900/5 border border-blue-500/10 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-blue-400">Desarrollo</label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={c.tiempoDesarrollo}
                              onChange={(e) => updateClass(c.id, 'tiempoDesarrollo', parseInt(e.target.value) || 0)}
                              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-blue-400 focus:border-blue-500/50 outline-none"
                            />
                            <span className="text-[10px] text-slate-500">min</span>
                          </div>
                        </div>
                        <textarea 
                          value={c.desarrollo}
                          onChange={(e) => updateClass(c.id, 'desarrollo', e.target.value)}
                          className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                          placeholder="Explicación, actividad principal..."
                        />
                      </div>
                      <div className="bg-amber-900/5 border border-amber-500/10 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-amber-400">Cierre</label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={c.tiempoCierre}
                              onChange={(e) => updateClass(c.id, 'tiempoCierre', parseInt(e.target.value) || 0)}
                              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-amber-400 focus:border-amber-500/50 outline-none"
                            />
                            <span className="text-[10px] text-slate-500">min</span>
                          </div>
                        </div>
                        <textarea 
                          value={c.cierre}
                          onChange={(e) => updateClass(c.id, 'cierre', e.target.value)}
                          className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 resize-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                          placeholder="Síntesis, ticket de salida..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 font-medium text-slate-400 hover:text-white transition-colors">
            Cerrar sin guardar
          </button>
          <button 
            onClick={() => onSave(rowId, classes)}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl flex items-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <CheckCircle className="w-5 h-5" /> Confirmar Desglose
          </button>
        </div>
      </div>
    </div>
  );
}
