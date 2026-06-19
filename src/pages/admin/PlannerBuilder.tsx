import React, { useState, useRef } from 'react';
import { Calendar, Save, Download, Plus, ListPlus, Trash2, BookOpen } from 'lucide-react';
import { calculateWeeks, WeekData } from '../../lib/plannerUtils';
import ClassDetailModal from '../../components/admin/ClassDetailModal';
import OAModal from '../../components/admin/OAModal';
import { NivelesEducativos, AsignaturasBase, AprendizajeEsperado } from '../../lib/curriculumData';
import html2pdf from 'html2pdf.js';

interface PlannerWeek extends WeekData {
  id: string;
  contenido: string;
  indicadores: string;
  experiencia: string;
  clases: any[];
}

interface PlannerUnit {
  id: string;
  name: string;
  oas: AprendizajeEsperado[];
  customOaText: string;
  weeks: PlannerWeek[];
}

export default function PlannerBuilder() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nivel, setNivel] = useState('7mo Básico');
  const [asignatura, setAsignatura] = useState('Matemática');
  
  // Bloques
  const [blocks1H, setBlocks1H] = useState(1);
  const [blocks2H, setBlocks2H] = useState(3);

  const [units, setUnits] = useState<PlannerUnit[]>([]);
  
  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<{unitId: string, weekId: string} | null>(null);
  
  const [isOAModalOpen, setIsOAModalOpen] = useState(false);
  const [selectedUnitIdForOA, setSelectedUnitIdForOA] = useState<string | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePlanner = () => {
    if (!startDate || !endDate) return;
    const allWeeks = calculateWeeks(startDate, endDate);
    
    // Al inicio, metemos todas las semanas en una sola "Unidad 1"
    const initialWeeks: PlannerWeek[] = allWeeks.map(w => ({
      ...w,
      id: Math.random().toString(36).substr(2, 9),
      contenido: '',
      indicadores: '',
      experiencia: '',
      clases: []
    }));

    setUnits([{
      id: Math.random().toString(36).substr(2, 9),
      name: 'Unidad 1',
      oas: [],
      customOaText: '',
      weeks: initialWeeks
    }]);
  };

  const updateWeek = (unitId: string, weekId: string, field: keyof PlannerWeek, value: any) => {
    setUnits(units.map(u => {
      if (u.id !== unitId) return u;
      return {
        ...u,
        weeks: u.weeks.map(w => w.id === weekId ? { ...w, [field]: value } : w)
      };
    }));
  };

  const updateUnit = (unitId: string, field: keyof PlannerUnit, value: any) => {
    setUnits(units.map(u => u.id === unitId ? { ...u, [field]: value } : u));
  };

  // Dividir unidad a partir de una semana
  const splitUnit = (unitIndex: number, weekIndex: number) => {
    const unit = units[unitIndex];
    if (weekIndex === 0) return; // No se puede dividir en la primera semana

    const newUnit1: PlannerUnit = {
      ...unit,
      weeks: unit.weeks.slice(0, weekIndex)
    };

    const newUnit2: PlannerUnit = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Unidad ${units.length + 1}`,
      oas: [],
      customOaText: '',
      weeks: unit.weeks.slice(weekIndex)
    };

    const newUnits = [...units];
    newUnits.splice(unitIndex, 1, newUnit1, newUnit2);
    setUnits(newUnits);
  };

  const openClassModal = (unitId: string, weekId: string) => {
    setSelectedWeek({ unitId, weekId });
    setIsClassModalOpen(true);
  };

  const openOAModal = (unitId: string) => {
    setSelectedUnitIdForOA(unitId);
    setIsOAModalOpen(true);
  };

  const handleSaveClasses = (unitId: string, weekId: string, classes: any[]) => {
    updateWeek(unitId, weekId, 'clases', classes);
    setIsClassModalOpen(false);
  };

  const handleSaveOAs = (selectedOAs: AprendizajeEsperado[]) => {
    if (selectedUnitIdForOA) {
      updateUnit(selectedUnitIdForOA, 'oas', selectedOAs);
    }
  };

  const exportPDF = () => {
    if (!pdfRef.current) return;
    const opt = {
      margin:       10,
      filename:     `Planificacion_${nivel}_${asignatura}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <div className="flex-1 bg-[#020617] h-full flex flex-col p-4 sm:p-8 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Creador de Planificaciones</h1>
          <p className="text-slate-400 mt-1">Genera tu planificación anual/semestral detallada</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportPDF}
            disabled={units.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5" /> Exportar PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
            <Save className="w-5 h-5" /> Guardar Planificación
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-wrap gap-6 shrink-0 shadow-lg">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Nivel</label>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white">
            {NivelesEducativos.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Asignatura</label>
          <select value={asignatura} onChange={(e) => setAsignatura(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white">
            {AsignaturasBase.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        
        <div className="w-px bg-slate-800 hidden lg:block"></div>
        
        <div className="flex-1 min-w-[130px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Fecha Inicio</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Fecha Término</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
        </div>

        <div className="w-px bg-slate-800 hidden lg:block"></div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Bloques Semanales</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-slate-500 absolute -mt-4">1 Hora</span>
              <input type="number" min="0" value={blocks1H} onChange={(e) => setBlocks1H(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-slate-500 absolute -mt-4">2 Horas</span>
              <input type="number" min="0" value={blocks2H} onChange={(e) => setBlocks2H(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </div>
          </div>
        </div>

        <div className="flex items-end">
          <button 
            onClick={generatePlanner}
            disabled={!startDate || !endDate}
            className="px-6 py-2.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 font-bold rounded-xl transition-colors flex items-center gap-2 h-[46px]"
          >
            <Calendar className="w-5 h-5" /> Generar Semanas
          </button>
        </div>
      </div>

      {/* Spreadsheet Area */}
      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl relative shadow-xl custom-scrollbar">
        {units.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Configura arriba y haz clic en "Generar Semanas"</p>
          </div>
        ) : (
          <div ref={pdfRef} className="bg-slate-900 p-4">
            <div className="mb-4 text-center hidden" id="pdf-header">
              <h2 className="text-2xl font-bold text-slate-800">Planificación: {asignatura} - {nivel}</h2>
            </div>
            <table className="w-full min-w-[1400px] text-left border-collapse bg-slate-900">
              <thead className="bg-slate-950 sticky top-0 z-20 shadow-md">
                <tr>
                  <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-1/4">Unidad / OAs</th>
                  <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-32">Semana / Fecha</th>
                  <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-1/4">Contenido / Temática</th>
                  <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-1/4">Indicadores / Experiencia</th>
                  <th className="p-4 font-bold text-slate-400 border-b border-slate-800 w-40 text-center">Plan de Clases</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, unitIndex) => (
                  <React.Fragment key={unit.id}>
                    {unit.weeks.map((week, weekIndex) => (
                      <tr key={week.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 group">
                        
                        {/* Celda de Unidad (Span) */}
                        {weekIndex === 0 && (
                          <td rowSpan={unit.weeks.length} className="p-4 align-top border-r border-slate-800/50 bg-slate-900/50">
                            <input 
                              type="text"
                              value={unit.name}
                              onChange={(e) => updateUnit(unit.id, 'name', e.target.value)}
                              className="w-full bg-transparent font-bold text-cyan-400 text-lg mb-4 focus:outline-none border-b border-transparent focus:border-cyan-500/50 transition-colors"
                              placeholder="Nombre de la Unidad..."
                            />
                            
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
                              <button 
                                onClick={() => openOAModal(unit.id)}
                                className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
                              >
                                <BookOpen className="w-4 h-4" /> Buscar OAs
                              </button>
                              
                              <div className="space-y-2">
                                {unit.oas.map(oa => (
                                  <div key={oa.id} className="bg-slate-900 rounded-lg p-2 border border-slate-800" title={oa.descripcion}>
                                    <span className="text-emerald-400 font-bold text-xs block mb-1">{oa.codigo}</span>
                                    <p className="text-slate-400 text-xs line-clamp-2 leading-tight">{oa.descripcion}</p>
                                  </div>
                                ))}
                              </div>

                              <textarea 
                                className="w-full bg-transparent border-t border-slate-800 p-2 text-xs text-slate-400 resize-none focus:ring-0 min-h-[60px]"
                                placeholder="Otros OAs externos o personalizados..."
                                value={unit.customOaText}
                                onChange={(e) => updateUnit(unit.id, 'customOaText', e.target.value)}
                              />
                            </div>
                          </td>
                        )}

                        {/* Semana y Fecha */}
                        <td className="p-4 align-top border-r border-slate-800/50">
                          <div className="flex flex-col gap-1 relative">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{week.monthName}</span>
                            <div className="w-12 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-slate-300 font-bold">
                              {week.weekNumber}
                            </div>
                            <span className="text-xs text-cyan-500 mt-1 whitespace-nowrap">{week.formattedDateRange}</span>
                            
                            {/* Split Unit Button */}
                            {weekIndex > 0 && (
                              <button 
                                onClick={() => splitUnit(unitIndex, weekIndex)}
                                title="Separar en una nueva unidad desde aquí"
                                className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-md transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Contenido Temático */}
                        <td className="p-4 align-top">
                          <textarea 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-[120px] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                            placeholder="Tema de la semana..."
                            value={week.contenido}
                            onChange={(e) => updateWeek(unit.id, week.id, 'contenido', e.target.value)}
                          />
                        </td>

                        {/* Indicadores y Experiencia */}
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-3">
                            <textarea 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-[54px] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                              placeholder="Indicadores..."
                              value={week.indicadores}
                              onChange={(e) => updateWeek(unit.id, week.id, 'indicadores', e.target.value)}
                            />
                            <textarea 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-[54px] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                              placeholder="Experiencia de aprendizaje..."
                              value={week.experiencia}
                              onChange={(e) => updateWeek(unit.id, week.id, 'experiencia', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* Planificar Clase */}
                        <td className="p-4 align-top text-center">
                          <button 
                            onClick={() => openClassModal(unit.id, week.id)}
                            className={`w-full h-[120px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${week.clases.length > 0 ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10' : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50'}`}
                          >
                            <ListPlus className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              {week.clases.length > 0 ? `${week.clases.length} Clases` : 'Planificar'}
                            </span>
                          </button>
                        </td>

                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedWeek && (
        <ClassDetailModal 
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          rowId={selectedWeek.weekId}
          weekStart={units.find(u => u.id === selectedWeek.unitId)?.weeks.find(w => w.id === selectedWeek.weekId)?.startDate || new Date()}
          weekEnd={units.find(u => u.id === selectedWeek.unitId)?.weeks.find(w => w.id === selectedWeek.weekId)?.endDate || new Date()}
          initialClasses={units.find(u => u.id === selectedWeek.unitId)?.weeks.find(w => w.id === selectedWeek.weekId)?.clases || []}
          onSave={(rowId, classes) => handleSaveClasses(selectedWeek.unitId, rowId, classes)}
          defaultClassCount={blocks1H + blocks2H}
        />
      )}

      {selectedUnitIdForOA && (
        <OAModal 
          isOpen={isOAModalOpen}
          onClose={() => setIsOAModalOpen(false)}
          nivelFiltro={nivel}
          asignaturaFiltro={asignatura}
          initialSelectedIds={units.find(u => u.id === selectedUnitIdForOA)?.oas.map(oa => oa.id) || []}
          onSelectOAs={handleSaveOAs}
        />
      )}
    </div>
  );
}
