import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Loader2, LayoutTemplate, ArrowLeft } from 'lucide-react';
import { DossierTemplate, getDossierTemplates, createDossierTemplate, updateDossierTemplate, deleteDossierTemplate } from '../../lib/dossiers';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function DossierTemplateBuilder() {
  const [templates, setTemplates] = useState<DossierTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
    setIsCreating(true);
    setName('');
    setHeaderContent('<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tbody><tr><td style="width: 20%; text-align: center; border: 1px solid #ccc; padding: 10px;">LOGO</td><td style="width: 80%; border: 1px solid #ccc; padding: 10px;"><h2>Mi Colegio</h2><p><b>Nombre:</b> ___________________________ <b>Fecha:</b> _________</p></td></tr></tbody></table>');
    setFooterContent('<div style="text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 12px;">Documento Institucional - Área Académica</div>');
  };

  const openEdit = (template: DossierTemplate) => {
    setEditingId(template.id);
    setIsCreating(false);
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
    setIsCreating(false);
    loadTemplates();
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla de dossier?')) {
      await deleteDossierTemplate(id);
      loadTemplates();
      if (editingId === id) {
        setEditingId(null);
        setIsCreating(false);
      }
    }
  };

  const isEditorActive = editingId !== null || isCreating;

  return (
    <div className={`w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8 transition-all ${isEditorActive ? 'max-w-[1000px]' : 'max-w-7xl'}`}>
      
      {/* Left Column: List of Templates */}
      {!isEditorActive && (
        <div className="w-full flex flex-col">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => openEdit(template)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all bg-slate-900 border-slate-800 hover:border-slate-600`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white pr-4 text-lg">{template.name}</h3>
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
                <div className="col-span-full">
                  <p className="text-slate-500 text-center py-8">No hay plantillas creadas.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right Column: Editor */}
      {isEditorActive && (
        <div className="w-full">
          <div className="bg-slate-100 border border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white p-4 border-b border-slate-300 flex justify-between items-center z-20 sticky top-0 shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100 flex items-center gap-1 font-bold text-sm">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Nombre de la Plantilla..." 
                  className="bg-transparent border-none text-xl font-bold text-slate-900 focus:outline-none focus:ring-0 flex-1 placeholder-slate-400" 
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                {saving ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </div>

            <div className="p-8 space-y-8 bg-slate-200">
              <div className="bg-white border border-slate-300 shadow-xl rounded-lg p-8 max-w-[900px] mx-auto text-slate-900">
                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                      Encabezado Institucional (Página 1)
                    </label>
                    <p className="text-sm text-slate-500 mb-4">Se mostrará al principio del Dossier. Aquí puedes armar el logo, curso, fecha, nombre del alumno y cuadro de objetivos/indicadores con tablas.</p>
                    <RichTextEditor theme="light" content={headerContent} onChange={(c) => setHeaderContent(c)} />
                  </div>
                </div>

                <div className="space-y-4 pt-12 mt-12 border-t border-slate-200">
                  <div>
                    <label className="block text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                      Pie de Página (Al final)
                    </label>
                    <p className="text-sm text-slate-500 mb-4">Aparecerá al final de la última hoja del dossier.</p>
                    <RichTextEditor theme="light" content={footerContent} onChange={(c) => setFooterContent(c)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
