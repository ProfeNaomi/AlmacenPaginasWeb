import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Save } from 'lucide-react';

export interface AnnualConditions {
  year: number;
  startDate: string;
  endDate: string;
  winterVacationStart: string;
  winterVacationEnd: string;
  nationalHolidays: string[]; // Simplificado
}

interface AnnualConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conditions: AnnualConditions;
  onSave: (c: AnnualConditions) => void;
}

export default function AnnualConditionsModal({ isOpen, onClose, conditions, onSave }: AnnualConditionsModalProps) {
  const [local, setLocal] = useState<AnnualConditions>(conditions);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-400" />
              Condiciones Anuales
            </h2>
            <p className="text-slate-400 text-sm mt-1">Configura las fechas globales para predeterminar el planificador</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Año Escolar</label>
              <input 
                type="number" 
                value={local.year}
                onChange={e => setLocal({...local, year: parseInt(e.target.value) || new Date().getFullYear()})}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <h3 className="font-bold text-indigo-400 border-b border-slate-800 pb-2">Fechas de Clases</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Inicio de Clases</label>
                <input 
                  type="date" 
                  value={local.startDate}
                  onChange={e => setLocal({...local, startDate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Término de Clases</label>
                <input 
                  type="date" 
                  value={local.endDate}
                  onChange={e => setLocal({...local, endDate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">Vacaciones de Invierno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Inicio Vacaciones</label>
                <input 
                  type="date" 
                  value={local.winterVacationStart}
                  onChange={e => setLocal({...local, winterVacationStart: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Regreso a Clases</label>
                <input 
                  type="date" 
                  value={local.winterVacationEnd}
                  onChange={e => setLocal({...local, winterVacationEnd: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 font-medium text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button 
            onClick={() => {
              onSave(local);
              onClose();
            }}
            className="px-6 py-2.5 bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-5 h-5" /> Guardar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
