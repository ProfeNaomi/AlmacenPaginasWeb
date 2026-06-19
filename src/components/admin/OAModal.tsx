import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Check } from 'lucide-react';
import { getOABank, CustomOA } from '../../lib/planner';
import { OAsMineduc } from '../../lib/curriculumData';

interface OAModalProps {
  isOpen: boolean;
  onClose: () => void;
  nivelFiltro: string;
  asignaturaFiltro: string;
  onSelectOAs: (selectedOAs: any[]) => void;
  initialSelectedIds?: string[];
}

export default function OAModal({ isOpen, onClose, nivelFiltro, asignaturaFiltro, onSelectOAs, initialSelectedIds = [] }: OAModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [bankOAs, setBankOAs] = useState<CustomOA[]>([]);

  useEffect(() => {
    if (isOpen) {
      getOABank().then(data => setBankOAs(data));
      setSelectedIds(initialSelectedIds);
    }
  }, [isOpen, initialSelectedIds]);

  if (!isOpen) return null;

  // Combinar Mineduc con Custom
  const allOAs = [...OAsMineduc, ...bankOAs];

  const filteredOAs = allOAs.filter(oa => {
    const matchesNivel = oa.nivel === nivelFiltro && oa.asignatura === asignaturaFiltro;
    const matchesSearch = oa.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          oa.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesNivel && matchesSearch;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const selectedObjs = allOAs.filter(oa => selectedIds.includes(oa.id));
    onSelectOAs(selectedObjs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              Base de Datos: Objetivos de Aprendizaje
            </h2>
            <p className="text-slate-400 text-sm mt-1">Mostrando OAs de {asignaturaFiltro} - {nivelFiltro}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-950">
          {filteredOAs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No se encontraron OAs.</div>
          ) : (
            filteredOAs.map((oa: any) => {
              const isSelected = selectedIds.includes(oa.id);
              return (
                <div 
                  key={oa.id} 
                  onClick={() => toggleSelection(oa.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-4 ${isSelected ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                >
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-950'}`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>{oa.codigo}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">Eje: {oa.eje}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>{oa.descripcion}</p>
                    
                    {oa.indicadores && oa.indicadores.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        <b>{oa.indicadores.length} indicadores</b> asociados en el Banco.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-400">{selectedIds.length} seleccionado(s)</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 font-medium text-slate-400 hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">Guardar Selección</button>
          </div>
        </div>
      </div>
    </div>
  );
}
