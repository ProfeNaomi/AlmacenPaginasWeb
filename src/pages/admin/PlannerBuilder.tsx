import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Save, Download, Plus, ListPlus, Trash2, BookOpen, Settings, FolderOpen, ArrowUp, Loader2 } from 'lucide-react';
import { calculateWeeks, WeekData } from '../../lib/plannerUtils';
import ClassDetailModal from '../../components/admin/ClassDetailModal';
import OAModal from '../../components/admin/OAModal';
import AnnualConditionsModal, { AnnualConditions } from '../../components/admin/AnnualConditionsModal';
import { NivelesEducativos, AsignaturasBase } from '../../lib/curriculumData';
import html2pdf from 'html2pdf.js';
import { savePlan, getUserPlans, getPlanById } from '../../lib/planner';
import { useAuth } from '../../context/AuthContext';

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
  oas: any[];
  customOaText: string;
  weeks: PlannerWeek[];
}

export default function PlannerBuilder() {
  const { user } = useAuth();
  
  const [conditions, setConditions] = useState<AnnualConditions>({
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    winterVacationStart: '',
    winterVacationEnd: '',
    nationalHolidays: []
  });

  const [nivel, setNivel] = useState('7mo Básico');
  const [asignatura, setAsignatura] = useState('Matemática');
  const [blocks1H, setBlocks1H] = useState(1);
  const [blocks2H, setBlocks2H] = useState(3);

  const [units, setUnits] = useState<PlannerUnit[]>([]);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<{unitId: string, weekId: string} | null>(null);
  
  const [isOAModalOpen, setIsOAModalOpen] = useState(false);
  const [selectedUnitIdForOA, setSelectedUnitIdForOA] = useState<string | null>(null);

  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getUserPlans(user.uid).then(plans => setSavedPlans(plans));
    }
  }, [user]);

  const handleLoadPlan = async (planId: string) => {
    const planData = await getPlanById(planId);
    if (planData) {
      setConditions(planData.conditions);
      setNivel(planData.nivel);
      setAsignatura(planData.asignatura);
      setBlocks1H(planData.blocks1H);
      setBlocks2H(planData.blocks2H);
      setUnits(planData.units);
    }
  };

  const handleSavePlan = async () => {
    if (!user) return;
    setIsSaving(true);
    const planId = `${nivel}-${asignatura}-${conditions.year}`.replace(/\s+/g, '-').toLowerCase();
    
    const planData = {
      conditions,
      nivel,
      asignatura,
      blocks1H,
      blocks2H,
      units,
      name: `Planificación ${asignatura} - ${nivel} (${conditions.year})`
    };

    await savePlan(user.uid, planId, planData);
    const plans = await getUserPlans(user.uid);
    setSavedPlans(plans);
    setIsSaving(false);
    alert('Planificación guardada exitosamente.');
  };

  const generatePlanner = () => {
    if (!conditions.startDate || !conditions.endDate) {
      alert("Por favor, configura la fecha de inicio y término en 'Condiciones Anuales'.");
      return;
    }
    const allWeeks = calculateWeeks(conditions.startDate, conditions.endDate);
    
    // Filtrar semanas que caen en vacaciones de invierno
    const filteredWeeks = allWeeks.filter(w => {
      if (!conditions.winterVacationStart || !conditions.winterVacationEnd) return true;
      const vStart = new Date(conditions.winterVacationStart);
      const vEnd = new Date(conditions.winterVacationEnd);
      // Si la semana termina antes de las vacaciones o empieza después, se incluye
      return w.endDate < vStart || w.startDate > vEnd;
    });

    const initialWeeks: PlannerWeek[] = filteredWeeks.map(w => ({
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

  const splitUnit = (unitIndex: number, weekIndex: number) => {
    const unit = units[unitIndex];
    if (weekIndex === 0) return; 

    const newUnit1: PlannerUnit = { ...unit, weeks: unit.weeks.slice(0, weekIndex) };
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

  const mergeUnitUp = (unitIndex: number) => {
    if (unitIndex === 0) return;
    const newUnits = [...units];
    const prevUnit = newUnits[unitIndex - 1];
    const currUnit = newUnits[unitIndex];
    
    // Fusionar semanas y OAs
    prevUnit.weeks = [...prevUnit.weeks, ...currUnit.weeks];
    
    // Eliminar la unidad actual
    newUnits.splice(unitIndex, 1);
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

  const exportPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    
    const opt = {
      margin:       10,
      filename:     `Planificacion_${nivel}_${asignatura}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    
    try {
      await html2pdf().set(opt).from(pdfRef.current).save();
    } catch(err) {
      console.error(err);
      alert('Error exportando PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getAvailableIndicators = (unit: PlannerUnit) => {
    let inds: string[] = [];
    unit.oas.forEach((oa: any) => {
      if (oa.indicadores) inds = [...inds, ...oa.indicadores];
    });
    return inds;
  };

  return (
    <div className="flex-1 bg-[#020617] h-full flex flex-col p-4 sm:p-8 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Creador de Planificaciones</h1>
          <p className="text-slate-400 mt-1">Genera tu planificación anual/semestral conectada al Banco de OAs</p>
        </div>
        <div className="flex gap-3">
          {savedPlans.length > 0 && (
            <select 
              className="bg-slate-800 text-slate-300 border border-slate-700 rounded-xl px-4 py-2"
              onChange={(e) => { if(e.target.value) handleLoadPlan(e.target.value) }}
            >
              <option value="">Cargar Planificación...</option>
              {savedPlans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <button 
            onClick={exportPDF}
            disabled={units.length === 0 || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
            {isExporting ? 'Procesando...' : 'Exportar PDF'}
          </button>
          <button 
            onClick={handleSavePlan}
            disabled={units.length === 0 || isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            Guardar Planificación
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
        
        <div className="flex-1 min-w-[200px] flex items-end">
          <button 
            onClick={() => setIsConditionsModalOpen(true)}
            className="w-full px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700 h-[46px]"
          >
            <Settings className="w-5 h-5" /> Condiciones Anuales ({conditions.year})
          </button>
        </div>

        <div className="w-px bg-slate-800 hidden lg:block"></div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-slate-400 mb-2">Bloques Semanales</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-slate-500 absolute -mt-4 uppercase font-bold">1 Hora</span>
              <input type="number" min="0" value={blocks1H} onChange={(e) => setBlocks1H(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-slate-500 absolute -mt-4 uppercase font-bold">2 Horas</span>
              <input type="number" min="0" value={blocks2H} onChange={(e) => setBlocks2H(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </div>
          </div>
        </div>

        <div className="flex items-end">
          <button 
            onClick={generatePlanner}
            className="px-6 py-2.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-bold rounded-xl transition-colors flex items-center gap-2 h-[46px]"
          >
            <Calendar className="w-5 h-5" /> Generar Semanas
          </button>
        </div>
      </div>

      {/* Spreadsheet Area */}
      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl relative shadow-xl custom-scrollbar">
        {units.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Carga una planificación guardada o genera semanas nuevas.</p>
          </div>
        ) : (
          <div ref={pdfRef} className="bg-slate-900 p-4">
            <div className="mb-4 text-center hidden" id="pdf-header">
              <h2 className="text-2xl font-bold text-slate-800">Planificación: {asignatura} - {nivel} ({conditions.year})</h2>
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
                          <td rowSpan={unit.weeks.length} className="p-4 align-top border-r border-slate-800/50 bg-slate-900/50 relative group/unit">
                            {unitIndex > 0 && (
                              <button 
                                onClick={() => mergeUnitUp(unitIndex)}
                                title="Unir con la unidad anterior"
                                className="absolute top-4 -left-3 opacity-0 group-hover/unit:opacity-100 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-md transition-all shadow-lg border border-slate-700 z-10"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                            )}

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
                                <BookOpen className="w-4 h-4" /> Asignar OAs
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
                                placeholder="OAs externos / Anotaciones..."
                                value={unit.customOaText}
                                onChange={(e) => updateUnit(unit.id, 'customOaText', e.target.value)}
                              />
                            </div>
                          </td>
                        )}

                        {/* Semana y Fecha */}
                        <td className="p-4 align-top border-r border-slate-800/50 relative">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{week.monthName}</span>
                            <div className="w-12 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-slate-300 font-bold">
                              {week.weekNumber}
                            </div>
                            <span className="text-[11px] text-cyan-500 mt-1 font-bold tracking-tight">{week.formattedDateRange}</span>
                            
                            {/* Split Unit Button */}
                            {weekIndex > 0 && (
                              <button 
                                onClick={() => splitUnit(unitIndex, weekIndex)}
                                title="Separar en una nueva unidad desde aquí"
                                className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-cyan-900 text-slate-400 hover:text-cyan-400 rounded-md transition-all border border-slate-700 z-10"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Contenido Temático */}
                        <td className="p-4 align-top">
                          <textarea 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-[140px] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                            placeholder="Contenido específico de esta semana..."
                            value={week.contenido}
                            onChange={(e) => updateWeek(unit.id, week.id, 'contenido', e.target.value)}
                          />
                        </td>

                        {/* Indicadores y Experiencia */}
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-3">
                            <div className="relative">
                              <select 
                                onChange={(e) => {
                                  if(e.target.value) {
                                    updateWeek(unit.id, week.id, 'indicadores', week.indicadores + (week.indicadores ? '\n• ' : '• ') + e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-t-xl px-2 py-1.5 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500 border-b-0"
                              >
                                <option value="">+ Insertar Indicador del Banco...</option>
                                {getAvailableIndicators(unit).map((ind, i) => (
                                  <option key={i} value={ind}>{ind.substring(0, 50)}...</option>
                                ))}
                              </select>
                              <textarea 
                                className="w-full bg-slate-950 border border-slate-800 rounded-b-xl rounded-t-none p-3 text-sm text-slate-200 resize-none h-[60px] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                placeholder="Indicadores..."
                                value={week.indicadores}
                                onChange={(e) => updateWeek(unit.id, week.id, 'indicadores', e.target.value)}
                              />
                            </div>
                            <textarea 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none h-[54px] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                              placeholder="Experiencia de aprendizaje (Breve)..."
                              value={week.experiencia}
                              onChange={(e) => updateWeek(unit.id, week.id, 'experiencia', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* Planificar Clase */}
                        <td className="p-4 align-top text-center">
                          <button 
                            onClick={() => openClassModal(unit.id, week.id)}
                            className={`w-full h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${week.clases.length > 0 ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10' : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50'}`}
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
          onSelectOAs={(oas) => {
            updateUnit(selectedUnitIdForOA, 'oas', oas);
          }}
        />
      )}

      <AnnualConditionsModal 
        isOpen={isConditionsModalOpen}
        onClose={() => setIsConditionsModalOpen(false)}
        conditions={conditions}
        onSave={setConditions}
      />
    </div>
  );
}
