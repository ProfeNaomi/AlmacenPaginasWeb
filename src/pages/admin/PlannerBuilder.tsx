import React, { useState } from 'react';
import { Calendar, Plus, Save, Download, Settings, ChevronRight, Search, ListPlus } from 'lucide-react';
import { calculateWeeks, WeekData } from '../../lib/plannerUtils';
import ClassDetailModal from '../../components/admin/ClassDetailModal';
import { OAsMineduc, NivelesEducativos, AsignaturasBase } from '../../lib/curriculumData';

interface PlannerRow extends WeekData {
  id: string;
  contenido: string;
  oas: string[]; // IDs de OAs
  customOaText: string;
  indicadores: string;
  experiencia: string;
  clases: any[];
}

export default function PlannerBuilder() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nivel, setNivel] = useState('7mo Básico');
  const [asignatura, setAsignatura] = useState('Matemática');
  
  const [rows, setRows] = useState<PlannerRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const filteredOAs = OAsMineduc.filter(oa => oa.nivel === nivel && oa.asignatura === asignatura);

  const generatePlanner = () => {
    if (!startDate || !endDate) return;
    const weeks = calculateWeeks(startDate, endDate);
    const newRows: PlannerRow[] = weeks.map(w => ({
      ...w,
      id: Math.random().toString(36).substr(2, 9),
      contenido: '',
      oas: [],
      customOaText: '',
      indicadores: '',
      experiencia: '',
      clases: []
    }));
    setRows(newRows);
  };

  const updateRow = (id: string, field: keyof PlannerRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleOA = (rowId: string, oaId: string) => {
    setRows(rows.map(r => {
      if (r.id !== rowId) return r;
      const oas = r.oas.includes(oaId) 
        ? r.oas.filter(id => id !== oaId)
        : [...r.oas, oaId];
      return { ...r, oas };
    }));
  };

  const openClassModal = (rowId: string) => {
    setSelectedRowId(rowId);
    setIsModalOpen(true);
  };

  const handleSaveClasses = (rowId: string, classes: any[]) => {
    updateRow(rowId, 'clases', classes);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 bg-[#020617] h-full flex flex-col p-4 sm:p-8 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Creador de Planificaciones</h1>
          <p className="text-slate-400 mt-1">Genera la planificación anual o semestral automatizada</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors">
            <Download className="w-5 h-5" /> Exportar PDF/Excel
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
            <Save className="w-5 h-5" /> Guardar Planificación
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-wrap gap-6 shrink-0">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Nivel Educativo</label>
          <select 
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
          >
            {NivelesEducativos.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Asignatura</label>
          <select 
            value={asignatura}
            onChange={(e) => setAsignatura(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
          >
            {AsignaturasBase.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="w-px bg-slate-800 hidden md:block"></div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Fecha Inicio</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Fecha Término</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={generatePlanner}
            disabled={!startDate || !endDate}
            className="px-6 py-3 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl transition-colors h-[50px] flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" /> Generar Semanas
          </button>
        </div>
      </div>

      {/* Spreadsheet / Table */}
      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl relative shadow-xl">
        {rows.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Ingresa las fechas y haz clic en "Generar Semanas" para iniciar tu planificación.</p>
          </div>
        ) : (
          <table className="w-full min-w-[1200px] text-left border-collapse">
            <thead className="bg-slate-950 sticky top-0 z-20">
              <tr>
                <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-24">Mes</th>
                <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-24">Semana</th>
                <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-1/5">Contenido / Temática</th>
                <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-1/4">Objetivos de Aprendizaje (OA)</th>
                <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-1/5">Indicadores / Experiencia</th>
                <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-40 text-center">Clase a Clase</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isNewMonth = i === 0 || rows[i-1].monthName !== row.monthName;
                
                return (
                  <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 align-top text-slate-300 font-medium">
                      {isNewMonth ? <span className="px-3 py-1 bg-slate-800 rounded-lg">{row.monthName}</span> : ''}
                    </td>
                    <td className="p-4 align-top">
                      <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 font-bold">
                        {row.weekNumber}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-32 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        placeholder="Escribe el tema..."
                        value={row.contenido}
                        onChange={(e) => updateRow(row.id, 'contenido', e.target.value)}
                      />
                    </td>
                    <td className="p-4 align-top">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-32 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {filteredOAs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {filteredOAs.map(oa => (
                              <button
                                key={oa.id}
                                onClick={() => toggleOA(row.id, oa.id)}
                                title={oa.descripcion}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${row.oas.includes(oa.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                              >
                                {oa.codigo}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        
                        <textarea 
                          className="w-full bg-transparent border-none p-0 mt-2 text-sm text-slate-400 resize-none focus:ring-0"
                          placeholder="OA externos o plan propio..."
                          value={row.customOaText}
                          onChange={(e) => updateRow(row.id, 'customOaText', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="p-4 align-top flex flex-col gap-2">
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-14 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        placeholder="Indicadores de Evaluación..."
                        value={row.indicadores}
                        onChange={(e) => updateRow(row.id, 'indicadores', e.target.value)}
                      />
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-14 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        placeholder="Experiencia de Aprendizaje..."
                        value={row.experiencia}
                        onChange={(e) => updateRow(row.id, 'experiencia', e.target.value)}
                      />
                    </td>
                    <td className="p-4 align-top text-center">
                      <button 
                        onClick={() => openClassModal(row.id)}
                        className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${row.clases.length > 0 ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10' : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50'}`}
                      >
                        <ListPlus className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {row.clases.length > 0 ? `${row.clases.length} Clases` : 'Planificar'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedRowId && (
        <ClassDetailModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          rowId={selectedRowId}
          weekStart={rows.find(r => r.id === selectedRowId)?.startDate || new Date()}
          weekEnd={rows.find(r => r.id === selectedRowId)?.endDate || new Date()}
          initialClasses={rows.find(r => r.id === selectedRowId)?.clases || []}
          onSave={handleSaveClasses}
        />
      )}
    </div>
  );
}
