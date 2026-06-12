import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Loader2, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { Cover, getCovers, createCover, updateCover, deleteCover } from '../../lib/covers';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function CoverBuilder() {
  const [covers, setCovers] = useState<Cover[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCovers();
  }, []);

  const loadCovers = async () => {
    setLoading(true);
    const data = await getCovers();
    setCovers(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setName('');
    // Plantilla por defecto para facilitar el inicio
    setFrontContent('<div style="text-align: center; padding-top: 50px;"><h1 style="font-size: 3rem; margin-bottom: 20px;">Mi Colegio</h1><h2>Ensayo PAES</h2><br/><p><b>Código:</b> [CÓDIGO AQUÍ]</p></div>');
    setBackContent('<div style="text-align: center; padding-top: 50px;"><h3>Fin del Ensayo</h3><p>Revisa tus respuestas antes de entregar.</p></div>');
  };

  const openEdit = (cover: Cover) => {
    setEditingId(cover.id);
    setName(cover.name);
    setFrontContent(cover.frontContent || '');
    setBackContent(cover.backContent || '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Debes ingresar un nombre para la plantilla.');
      return;
    }
    setSaving(true);
    const data = {
      name,
      frontContent,
      backContent
    };

    if (editingId) {
      await updateCover(editingId, data);
    } else {
      await createCover(data);
    }
    
    setSaving(false);
    loadCovers();
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla de portada?')) {
      await deleteCover(id);
      loadCovers();
      if (editingId === id) setEditingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
      
      {/* Left Column: List of Covers */}
      <div className="w-full lg:w-1/3 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-purple-400" /> Portadas
          </h1>
          <button 
            onClick={openNew}
            className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition-colors"
            title="Nueva Plantilla"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : (
          <div className="space-y-3">
            {covers.map(cover => (
              <div 
                key={cover.id}
                onClick={() => openEdit(cover)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${editingId === cover.id ? 'bg-purple-900/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white truncate pr-4">{cover.name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(cover.id); }}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {covers.length === 0 && (
              <p className="text-slate-500 text-center py-8">No hay plantillas creadas.</p>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Editor */}
      <div className="w-full lg:w-2/3">
        {editingId !== null || name !== '' || frontContent !== '' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                {saving ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nombre de la Plantilla</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ej. Portada Oficial Colegio 2026" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 font-bold" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400"/> Portada Frontal (Página 1)
                </label>
                <p className="text-xs text-slate-400 mb-2">Diseña aquí la página principal. Puedes insertar imágenes (Ej. exportadas desde Canva) o escribir texto. En el PDF ocupará la hoja completa.</p>
                <RichTextEditor content={frontContent} onChange={setFrontContent} />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400"/> Hoja de Cierre / Contraportada (Última Página)
                </label>
                <p className="text-xs text-slate-400 mb-2">Se imprimirá al final de todo el ensayo, después de la tabla de respuestas correctas.</p>
                <RichTextEditor content={backContent} onChange={setBackContent} />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/50">
            <LayoutTemplate className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-lg font-bold">Selecciona o crea una plantilla de portada</p>
          </div>
        )}
      </div>

    </div>
  );
}
