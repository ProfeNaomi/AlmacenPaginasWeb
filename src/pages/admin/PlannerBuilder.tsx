import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Save, Download, Plus, ListPlus, Trash2, BookOpen, Settings, FolderOpen, ArrowUp, Loader2 } from 'lucide-react';
import { calculateWeeks, WeekData } from '../../lib/plannerUtils';
import ClassDetailModal from '../../components/admin/ClassDetailModal';
import OAModal from '../../components/admin/OAModal';
import AnnualConditionsModal, { AnnualConditions } from '../../components/admin/AnnualConditionsModal';
import { NivelesEducativos, AsignaturasBase } from '../../lib/curriculumData';
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

  const exportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const getAvailableIndicators = (unit: PlannerUnit) => {
    let inds: string[] = [];
    unit.oas.forEach((oa: any) => {
      if (oa.indicadores) inds = [...inds, ...oa.indicadores];
    });
    return inds;
  };

  return (
    <div className="flex-1 bg-[#020617] print:bg-white print:text-black h-full flex flex-col p-4 sm:p-8 font-sans overflow-hidden print:overflow-visible">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0 print:hidden">
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-wrap gap-6 shrink-0 shadow-lg print:hidden">
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
      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl relative shadow-xl custom-scrollbar print:overflow-visible print:bg-white print:border-none print:shadow-none print:rounded-none w-full print:absolute print:inset-0 print:m-0 print:p-0">
        {units.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 print:hidden">
            <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Carga una planificación guardada o genera semanas nuevas.</p>
          </div>
        ) : (
          <div ref={pdfRef} className="bg-slate-900 p-4 print:bg-white print:p-0">
            {/* Header exclusivo para impresión */}
            <div className="hidden print:block mb-6 text-black font-serif">
              <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                  <h3 className="font-bold text-lg">Liceo Bicentenario de Niñas de Maipú</h3>
                  <p>Unidad Técnico-Pedagógica</p>
                  <p>Departamento ....</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-lg text-blue-900">LICEOS ★</h3>
                  <h3 className="font-bold text-lg text-blue-900">BICENTENARIO</h3>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-widest">Planificación Semestral</h1>
              
              <div className="mb-6 text-base font-bold">
                <p>Profesor (a): Naomi Stephanie Urrea Salinas</p>
                <p>Nivel: {nivel}</p>
                <p>Subsector de aprendizaje: {asignatura}</p>
              </div>
            </div>

            <table className="w-full min-w-[1400px] print:min-w-full text-left border-collapse bg-slate-900 print:bg-white print:text-black planner-table">
              <thead className="bg-slate-950 sticky top-0 z-20 shadow-md print:bg-blue-200/50 print:text-black print:static print:shadow-none">
                <tr>
                  <th className="p-4 font-bold text-slate-400 print:text-black border border-slate-800 print:border-black w-24 uppercase text-sm text-center">Mes</th>
                  <th className="p-4 font-bold text-slate-400 print:text-black border border-slate-800 print:border-black w-20 uppercase text-sm text-center">Sem</th>
                  <th className="p-4 font-bold text-slate-400 print:text-black border border-slate-800 print:border-black w-1/5 uppercase text-sm text-center">Contenido o Temática</th>
                  <th className="p-4 font-bold text-slate-400 print:text-black border border-slate-800 print:border-black w-1/4 uppercase text-sm text-center">Objetivos de Aprendizaje</th>
                  <th className="p-4 font-bold text-slate-400 print:text-black border border-slate-800 print:border-black w-1/4 uppercase text-sm text-center">Indicadores y/o Actitud</th>
                  <th className="p-4 font-bold text-slate-400 print:text-black border border-slate-800 print:border-black w-1/4 uppercase text-sm text-center">Experiencia de Aprendizaje</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, unitIndex) => (
                  <React.Fragment key={unit.id}>
                    {unit.weeks.map((week, weekIndex) => (
                      <tr key={week.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 group">
                        
                        {/* Celda de Mes (que antes era Unidad) */}
                        {weekIndex === 0 && (
                          <td rowSpan={unit.weeks.length} className="p-4 align-middle border border-slate-800/50 print:border-black bg-slate-900/50 print:bg-white text-center print:border-r">
                            {unitIndex > 0 && (
                              <button 
                                onClick={() => mergeUnitUp(unitIndex)}
                                title="Unir con la unidad anterior"
                                className="absolute top-4 -left-3 opacity-0 group-hover/unit:opacity-100 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-md transition-all shadow-lg border border-slate-700 z-10 print:hidden"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                            )}

                            <div className="rotate-180 print:rotate-0 print:writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
                              <input 
                                type="text"
                                value={unit.name}
                                onChange={(e) => updateUnit(unit.id, 'name', e.target.value)}
                                className="w-full bg-transparent font-bold text-cyan-400 print:text-black text-xl mb-4 focus:outline-none border-b border-transparent focus:border-cyan-500/50 transition-colors text-center"
                                placeholder="Mes..."
                              />
                            </div>
                          </td>
                        )}

                        {/* Semana y Fecha */}
                        <td className="p-4 align-top border border-slate-800/50 print:border-black relative text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="font-bold print:text-black">{week.weekNumber}</span>
                            <span className="text-[10px] text-cyan-500 print:text-slate-600 font-bold tracking-tight whitespace-nowrap">{week.formattedDateRange}</span>
                            
                            {weekIndex > 0 && (
                              <button 
                                onClick={() => splitUnit(unitIndex, weekIndex)}
                                title="Separar en una nueva unidad desde aquí"
                                className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-cyan-900 text-slate-400 hover:text-cyan-400 rounded-md transition-all border border-slate-700 z-10 print:hidden"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Contenido Temático */}
                        <td className="p-0 align-top border border-slate-800/50 print:border-black">
                          <textarea 
                            className="w-full bg-slate-950 print:bg-white border-none p-4 text-sm text-slate-200 print:text-black resize-none min-h-[160px] focus:ring-0"
                            placeholder="Contenido específico de esta semana..."
                            value={week.contenido}
                            onChange={(e) => updateWeek(unit.id, week.id, 'contenido', e.target.value)}
                          />
                        </td>

                        {/* Objetivos de Aprendizaje (Movemos OAs acá) */}
                        <td className="p-0 align-top border border-slate-800/50 print:border-black">
                          <div className="p-4 h-full flex flex-col gap-3 min-h-[160px]">
                            <button 
                              onClick={() => openOAModal(unit.id)}
                              className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors print:hidden"
                            >
                              <BookOpen className="w-4 h-4" /> Asignar OAs
                            </button>
                            
                            <div className="space-y-3">
                              {unit.oas.map(oa => (
                                <div key={oa.id} className="print:border-none print:p-0 bg-slate-900 print:bg-white rounded-lg p-3 border border-slate-800" title={oa.descripcion}>
                                  <span className="text-emerald-400 print:text-black font-bold text-sm block mb-1">{oa.codigo}</span>
                                  <p className="text-slate-400 print:text-black text-xs leading-relaxed">{oa.descripcion}</p>
                                </div>
                              ))}
                            </div>

                            <textarea 
                              className="w-full bg-transparent border-t border-slate-800 print:border-none pt-2 text-xs text-slate-400 print:text-black resize-none focus:ring-0 min-h-[60px]"
                              placeholder="OAs externos..."
                              value={unit.customOaText}
                              onChange={(e) => updateUnit(unit.id, 'customOaText', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* Indicadores */}
                        <td className="p-0 align-top border border-slate-800/50 print:border-black">
                          <div className="h-full min-h-[160px]">
                            <select 
                              onChange={(e) => {
                                if(e.target.value) {
                                  updateWeek(unit.id, week.id, 'indicadores', week.indicadores + (week.indicadores ? '\n• ' : '• ') + e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full bg-slate-950 border-b border-slate-800 px-2 py-1.5 text-xs text-cyan-400 focus:outline-none print:hidden"
                            >
                              <option value="">+ Insertar Indicador...</option>
                              {getAvailableIndicators(unit).map((ind, i) => (
                                <option key={i} value={ind}>{ind.substring(0, 50)}...</option>
                              ))}
                            </select>
                            <textarea 
                              className="w-full bg-slate-950 print:bg-white border-none p-4 text-sm text-slate-200 print:text-black resize-none min-h-[130px] focus:ring-0"
                              placeholder="Indicadores..."
                              value={week.indicadores}
                              onChange={(e) => updateWeek(unit.id, week.id, 'indicadores', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* Experiencia de Aprendizaje */}
                        <td className="p-0 align-top border border-slate-800/50 print:border-black relative">
                          <textarea 
                            className="w-full bg-slate-950 print:bg-white border-none p-4 text-sm text-slate-200 print:text-black resize-none min-h-[160px] focus:ring-0"
                            placeholder="Experiencia de aprendizaje..."
                            value={week.experiencia}
                            onChange={(e) => updateWeek(unit.id, week.id, 'experiencia', e.target.value)}
                          />
                          
                          {/* Planificar Clase - Oculto en impresión porque va separado */}
                          <div className="absolute bottom-2 right-2 print:hidden">
                            <button 
                              onClick={() => openClassModal(unit.id, week.id)}
                              className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg border ${week.clases.length > 0 ? 'bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                            >
                              <ListPlus className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase">
                                {week.clases.length > 0 ? `${week.clases.length} Clases` : 'Planificar'}
                              </span>
                            </button>
                          </div>
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
