import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, Trash2, Edit } from 'lucide-react';
import { getOABank, saveCustomOA, deleteCustomOA, CustomOA } from '../../lib/planner';
import { NivelesEducativos, AsignaturasBase } from '../../lib/curriculumData';

export default function OABank() {
  const [oas, setOAs] = useState<CustomOA[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOA, setEditingOA] = useState<CustomOA | null>(null);

  useEffect(() => {
    loadOAs();
  }, []);

  const loadOAs = async () => {
    setLoading(true);
    const bank = await getOABank();
    setOAs(bank);
    setLoading(false);
  };

  const handleCreateNew = () => {
    setEditingOA({
      id: `custom-oa-${Date.now()}`,
      nivel: NivelesEducativos[8], // 7mo basico por defecto
      asignatura: AsignaturasBase[0], // Matematica por defecto
      eje: '',
      codigo: '',
      descripcion: '',
      indicadores: []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editingOA) {
      await saveCustomOA(editingOA);
      await loadOAs();
      setIsEditing(false);
      setEditingOA(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este OA y sus indicadores?')) {
      await deleteCustomOA(id);
      await loadOAs();
    }
  };

  const updateIndicator = (index: number, value: string) => {
    if (!editingOA) return;
    const newInds = [...editingOA.indicadores];
    newInds[index] = value;
    setEditingOA({ ...editingOA, indicadores: newInds });
  };

  const addIndicator = () => {
    if (!editingOA) return;
    setEditingOA({ ...editingOA, indicadores: [...editingOA.indicadores, ''] });
  };

  const removeIndicator = (index: number) => {
    if (!editingOA) return;
    const newInds = editingOA.indicadores.filter((_, i) => i !== index);
    setEditingOA({ ...editingOA, indicadores: newInds });
  };

  return (
    <div className="flex-1 bg-[#020617] h-full flex flex-col p-4 sm:p-8 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Banco de OAs e Indicadores</h1>
          <p className="text-slate-400 mt-1">Alimenta tu base de datos centralizada de objetivos de aprendizaje</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-400 transition-colors"
          >
            <Plus className="w-5 h-5" /> Agregar Nuevo OA
          </button>
        )}
      </div>

      {isEditing && editingOA ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {editingOA.codigo ? `Editando: ${editingOA.codigo}` : 'Nuevo Objetivo de Aprendizaje'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Nivel</label>
              <select 
                value={editingOA.nivel} 
                onChange={(e) => setEditingOA({...editingOA, nivel: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
              >
                {NivelesEducativos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Asignatura</label>
              <select 
                value={editingOA.asignatura} 
                onChange={(e) => setEditingOA({...editingOA, asignatura: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
              >
                {AsignaturasBase.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Eje (Ej: Geometría)</label>
              <input 
                type="text" 
                value={editingOA.eje} 
                onChange={(e) => setEditingOA({...editingOA, eje: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Código (Ej: OA 10)</label>
              <input 
                type="text" 
                value={editingOA.codigo} 
                onChange={(e) => setEditingOA({...editingOA, codigo: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 mb-1">Descripción del Objetivo</label>
            <textarea 
              value={editingOA.descripcion} 
              onChange={(e) => setEditingOA({...editingOA, descripcion: e.target.value})}
              className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="mb-6 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-cyan-400">Indicadores de Evaluación</label>
              <button 
                onClick={addIndicator}
                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Agregar Indicador
              </button>
            </div>
            <div className="space-y-3">
              {editingOA.indicadores.map((ind, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={ind} 
                    onChange={(e) => updateIndicator(i, e.target.value)}
                    placeholder="Escribe el indicador aquí..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-cyan-500"
                  />
                  <button onClick={() => removeIndicator(i)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {editingOA.indicadores.length === 0 && (
                <p className="text-slate-500 text-sm italic">No hay indicadores. Agrega uno.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => { setIsEditing(false); setEditingOA(null); }}
              className="px-6 py-2 font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-5 h-5" /> Guardar Objetivo
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-slate-500">Cargando base de datos...</p>
        ) : oas.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">Base de datos vacía</h3>
            <p className="text-slate-500 mb-6">Aún no has agregado OAs a tu banco personalizado.</p>
          </div>
        ) : (
          oas.map(oa => (
            <div key={oa.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-emerald-400 text-lg">{oa.codigo}</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                    {oa.nivel} • {oa.asignatura} • {oa.eje}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{oa.descripcion}</p>
                
                {oa.indicadores && oa.indicadores.length > 0 && (
                  <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">Indicadores ({oa.indicadores.length})</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {oa.indicadores.map((ind, i) => (
                        <li key={i} className="text-xs text-slate-400">{ind}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                <button 
                  onClick={() => { setEditingOA(oa); setIsEditing(true); }}
                  className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(oa.id)}
                  className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
