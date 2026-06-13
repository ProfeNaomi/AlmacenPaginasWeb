import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Loader2, LayoutTemplate } from 'lucide-react';
import { DossierTemplate, getDossierTemplates, createDossierTemplate, updateDossierTemplate, deleteDossierTemplate } from '../../lib/dossiers';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function DossierTemplateBuilder() {
  const [templates, setTemplates] = useState<DossierTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [headerContent, setHeaderContent] = useState('');
  const [footerContent, setFooterContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await getDossierTemplates();
    setTemplates(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setName('');
    setHeaderContent('<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tbody><tr><td style="width: 20%; text-align: center; border: 1px solid #ccc; padding: 10px;">LOGO</td><td style="width: 80%; border: 1px solid #ccc; padding: 10px;"><h2>Mi Colegio</h2><p><b>Nombre:</b> ___________________________ <b>Fecha:</b> _________</p></td></tr></tbody></table>');
    setFooterContent('<div style="text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 12px;">Documento Institucional - Área Académica</div>');
  };

  const openEdit = (template: DossierTemplate) => {
    setEditingId(template.id);
    setName(template.name);
    setHeaderContent(template.headerContent || '');
    setFooterContent(template.footerContent || '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Debes ingresar un nombre para la plantilla.');
      return;
    }
    setSaving(true);
    const data = {
      name,
      headerContent,
      footerContent
    };

    if (editingId) {
      await updateDossierTemplate(editingId, data);
    } else {
      await createDossierTemplate(data);
    }
    
    setSaving(false);
    loadTemplates();
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla de dossier?')) {
      await deleteDossierTemplate(id);
      loadTemplates();
      if (editingId === id) setEditingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
      
      {/* Left Column: List of Templates */}
      <div className="w-full lg:w-1/3 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-emerald-400" /> Plantillas Dossier
          </h1>
          <button 
            onClick={openNew}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-colors"
            title="Nueva Plantilla"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <div 
                key={template.id}
                onClick={() => openEdit(template)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${editingId === template.id ? 'bg-emerald-900/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white truncate pr-4">{template.name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-slate-500 text-center py-8">No hay plantillas creadas.</p>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Editor */}
      <div className="w-full lg:w-2/3">
        {editingId !== null || name !== '' ? (
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
                  placeholder="Ej. Plantilla Oficial Matemática" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-bold" 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-white flex items-center gap-2 mb-2">
                    Encabezado Institucional (Página 1)
                  </label>
                  <p className="text-sm text-slate-400 mb-4">Se mostrará al principio del Dossier. Aquí puedes armar el logo, curso, fecha, nombre del alumno y cuadro de objetivos/indicadores con tablas.</p>
                  <RichTextEditor content={headerContent} onChange={(c) => setHeaderContent(c)} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-lg font-bold text-white flex items-center gap-2 mb-2">
                    Pie de Página (Opcional)
                  </label>
                  <p className="text-sm text-slate-400 mb-4">Aparecerá al final del dossier o en la parte inferior de las hojas impresas (requiere ajustes de impresión CSS).</p>
                  <RichTextEditor content={footerContent} onChange={(c) => setFooterContent(c)} />
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/50">
            <LayoutTemplate className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-lg font-bold">Selecciona o crea una plantilla institucional</p>
          </div>
        )}
      </div>

    </div>
  );
}
