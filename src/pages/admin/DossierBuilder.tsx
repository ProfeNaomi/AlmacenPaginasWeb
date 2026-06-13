import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Loader2, ArrowUp, ArrowDown, Type, Image as ImageIcon, Video, Layout, MessageSquare, Columns, FileText, Settings, PlaySquare } from 'lucide-react';
import { Dossier, DossierPage, getDossiers, createDossier, updateDossier, deleteDossier, getDossierTemplates, DossierTemplate } from '../../lib/dossiers';
import { Block } from '../../lib/courses';
import RichTextEditor from '../../components/ui/RichTextEditor';

const cleanForFirestore = (obj: any): any => {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter(item => item !== undefined);
  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const val = cleanForFirestore(obj[key]);
      if (val !== undefined) acc[key] = val;
      return acc;
    }, {} as any);
  }
  return obj;
};

const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 6);

export default function DossierBuilder() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [templates, setTemplates] = useState<DossierTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [pages, setPages] = useState<DossierPage[]>([{ id: generateId(), blocks: [] }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [dList, tList] = await Promise.all([getDossiers(), getDossierTemplates()]);
    setDossiers(dList);
    setTemplates(tList);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setIsCreating(true);
    setTitle('');
    setDescription('');
    setTemplateId('');
    setIsPublished(false);
    setPages([{ id: generateId(), blocks: [] }]);
  };

  const openEdit = (dossier: Dossier) => {
    setEditingId(dossier.id);
    setIsCreating(false);
    setTitle(dossier.title);
    setDescription(dossier.description || '');
    setTemplateId(dossier.templateId || '');
    setIsPublished(dossier.isPublished || false);
    setPages(dossier.pages && dossier.pages.length > 0 ? dossier.pages : [{ id: generateId(), blocks: [] }]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Debes ingresar un título.');
      return;
    }
    setSaving(true);
    const data = {
      title,
      description,
      templateId,
      isPublished,
      pages: cleanForFirestore(pages)
    };

    if (editingId) {
      await updateDossier(editingId, data as any);
    } else {
      await createDossier(data as any);
    }
    
    setSaving(false);
    setIsCreating(false);
    loadData();
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este dossier?')) {
      await deleteDossier(id);
      loadData();
      if (editingId === id) {
        setEditingId(null);
        setIsCreating(false);
      }
    }
  };

  // Block management
  const addBlock = (type: Block['type'], targetArray: Block[], setArray: (arr: Block[]) => void, theme?: Block['theme']) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: type === 'text' || type === 'box' || type === 'challenge' ? '' : undefined,
      url: ['image', 'video', 'app'].includes(type) ? '' : undefined,
      zoom: type === 'image' ? false : undefined,
      title: type === 'box' ? (theme === 'theorem' ? 'Teorema / Definición' : theme === 'alert' ? 'Alerta' : 'Nuevo Recuadro') : undefined,
      theme: type === 'box' ? (theme || 'history') : undefined,
      columns: type === 'row' ? [
        { id: generateId(), blocks: [] },
        { id: generateId(), blocks: [] }
      ] : undefined,
      stepBlocks: type === 'step-by-step' ? [] : undefined,
    };
    setArray([...targetArray, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down', targetArray: Block[], setArray: (arr: Block[]) => void) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === targetArray.length - 1) return;
    const newBlocks = [...targetArray];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setArray(newBlocks);
  };

  const addColumn = (rowId: string, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.map(b => {
      if (b.id === rowId && b.columns && b.columns.length < 4) {
        return { ...b, columns: [...b.columns, { id: generateId(), blocks: [] }] };
      }
      return b;
    }));
  };

  const removeColumn = (rowId: string, colId: string, targetArray: Block[], setArray: (arr: Block[]) => void) => {
    setArray(targetArray.map(b => {
      if (b.id === rowId && b.columns && b.columns.length > 1) {
        return { ...b, columns: b.columns.filter(c => c.id !== colId) };
      }
      return b;
    }));
  };

  const renderBlockEditor = (block: Block, index: number, blocksArray: Block[], setBlocksArray: (arr: Block[]) => void) => {
    if (block.type === 'page-break') return null;

    if (block.type === 'row') {
      return (
        <div key={block.id} className="group relative bg-white/5 border border-slate-700/50 rounded-xl p-4 hover:border-slate-500 transition-colors my-2">
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveBlock(index, 'up', blocksArray, setBlocksArray)} disabled={index === 0} className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
            <button onClick={() => moveBlock(index, 'down', blocksArray, setBlocksArray)} disabled={index === blocksArray.length - 1} className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
          </div>
          <button onClick={() => removeBlock(block.id, blocksArray, setBlocksArray)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg z-10"><Trash2 className="w-3 h-3" /></button>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Fila ({block.columns?.length} Columnas)</span>
            </div>
            {block.columns && block.columns.length < 4 && (
              <button onClick={() => addColumn(block.id, blocksArray, setBlocksArray)} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700 font-bold">+ Columna</button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            {block.columns?.map(col => {
              const updateColBlocks = (newBlocks: Block[]) => {
                const newCols = block.columns!.map(c => c.id === col.id ? { ...c, blocks: newBlocks as any } : c);
                updateBlock(block.id, { columns: newCols }, blocksArray, setBlocksArray);
              };
              return (
                <div key={col.id} className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg p-3 min-h-[100px] flex flex-col relative group/col">
                  {block.columns!.length > 1 && (
                    <button onClick={() => removeColumn(block.id, col.id, blocksArray, setBlocksArray)} className="absolute top-1 right-1 text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover/col:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                  )}
                  <div className="space-y-3 mt-4">
                    {col.blocks.map((subBlock, subIdx) => renderBlockEditor(subBlock as Block, subIdx, col.blocks as Block[], updateColBlocks))}
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-800/50 flex justify-center gap-1 flex-wrap">
                    <button onClick={() => addBlock('text', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-cyan-400 rounded"><Type className="w-3 h-3"/></button>
                    <button onClick={() => addBlock('image', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-blue-400 rounded"><ImageIcon className="w-3 h-3"/></button>
                    <button onClick={() => addBlock('box', col.blocks as Block[], updateColBlocks)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-amber-400 rounded"><MessageSquare className="w-3 h-3"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Default block wrapper
    return (
      <div key={block.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors my-2">
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => moveBlock(index, 'up', blocksArray, setBlocksArray)} disabled={index === 0} className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
          <button onClick={() => moveBlock(index, 'down', blocksArray, setBlocksArray)} disabled={index === blocksArray.length - 1} className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
        </div>
        <button onClick={() => removeBlock(block.id, blocksArray, setBlocksArray)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg z-20"><Trash2 className="w-3 h-3" /></button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-slate-800 rounded">
            {block.type === 'text' && <Type className="w-3 h-3 text-cyan-400" />}
            {block.type === 'image' && <ImageIcon className="w-3 h-3 text-blue-400" />}
            {block.type === 'box' && <MessageSquare className="w-3 h-3 text-amber-400" />}
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bloque {block.type}</span>
        </div>

        {block.type === 'box' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="text" value={block.title || ''} onChange={(e) => updateBlock(block.id, { title: e.target.value }, blocksArray, setBlocksArray)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="Título..." />
              <select value={block.theme || 'history'} onChange={(e) => updateBlock(block.id, { theme: e.target.value as any }, blocksArray, setBlocksArray)} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="history">Información / Historia (Café)</option>
                <option value="formula">Fórmula (Morado)</option>
                <option value="exercise">Ejercitación (Verde)</option>
                <option value="warning">Cuidado (Rojo)</option>
                <option value="theorem">Teorema (Azul/Verde)</option>
                <option value="alert">Alerta (Naranja)</option>
              </select>
            </div>
            <RichTextEditor content={block.content || ''} onChange={(val) => updateBlock(block.id, { content: val }, blocksArray, setBlocksArray)} />
          </div>
        )}

        {block.type === 'text' && <RichTextEditor content={block.content || ''} onChange={(val) => updateBlock(block.id, { content: val }, blocksArray, setBlocksArray)} />}

        {block.type === 'image' && (
          <div className="space-y-2">
            <input type="url" value={block.url || ''} onChange={(e) => updateBlock(block.id, { url: e.target.value }, blocksArray, setBlocksArray)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="URL de la imagen (ej: GitHub Raw)" />
            {block.url && <div className="mt-2 border border-slate-800 rounded bg-black/50 flex justify-center"><img src={block.url} alt="Preview" className="max-h-48 object-contain" /></div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
      
      {/* Left Column: List */}
      <div className="w-full lg:w-1/4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" /> Dossiers
          </h1>
          <button onClick={openNew} className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl transition-colors"><Plus className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : (
          <div className="space-y-3">
            {dossiers.map(dossier => (
              <div key={dossier.id} onClick={() => openEdit(dossier)} className={`p-4 rounded-xl border cursor-pointer transition-all ${editingId === dossier.id ? 'bg-amber-900/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white truncate pr-4 text-sm">{dossier.title}</h3>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(dossier.id); }} className="text-slate-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                {!dossier.isPublished && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded mt-2 inline-block">Borrador</span>}
              </div>
            ))}
            {dossiers.length === 0 && <p className="text-slate-500 text-center text-sm py-8">No hay dossiers creados.</p>}
          </div>
        )}
      </div>

      {/* Right Column: Editor */}
      <div className="w-full lg:w-3/4">
        {editingId !== null || isCreating ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full min-h-[80vh]">
            
            {/* Header controls */}
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center z-10 sticky top-0">
              <div className="flex items-center gap-4 flex-1">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del Dossier..." className="bg-transparent border-none text-xl font-bold text-white focus:outline-none focus:ring-0 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500" />
                  Publicado
                </label>
                <button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? '...' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Settings Bar */}
            <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex gap-4 text-sm">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1">Descripción Corta</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500" placeholder="Breve resumen de los contenidos..." />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><LayoutTemplate className="w-3 h-3"/> Plantilla Institucional</label>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500">
                  <option value="">(Ninguna)</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Pages Editor */}
            <div className="p-6 bg-slate-800/30 overflow-y-auto flex-1 space-y-12">
              {pages.map((page, pIdx) => {
                const setPageBlocks = (newBlocks: Block[]) => {
                  const newPages = [...pages];
                  newPages[pIdx].blocks = newBlocks;
                  setPages(newPages);
                };

                return (
                  <div key={page.id} className="relative max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hoja {pIdx + 1}</span>
                      <button onClick={() => setPages(pages.filter((_, i) => i !== pIdx))} className="text-slate-500 hover:text-red-400 p-1 text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3"/> Eliminar Hoja</button>
                    </div>

                    {/* A4 Canvas Simulation */}
                    <div className="bg-slate-950 border border-slate-700 shadow-2xl rounded-sm min-h-[800px] p-8 flex flex-col">
                      {pIdx === 0 && templateId && (
                        <div className="mb-6 p-4 border-2 border-dashed border-emerald-900/50 bg-emerald-900/10 rounded-lg text-center text-emerald-500/50 text-sm font-bold">
                          [ Plantilla Institucional se insertará aquí al imprimir ]
                        </div>
                      )}

                      <div className="flex-1 space-y-4">
                        {page.blocks.map((block, bIdx) => renderBlockEditor(block as Block, bIdx, page.blocks as Block[], setPageBlocks))}
                        {page.blocks.length === 0 && <div className="text-center py-20 text-slate-600 italic">Hoja en blanco. Añade bloques usando los botones inferiores.</div>}
                      </div>

                      {/* Add Block Toolbar for this Page */}
                      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-center gap-2 sticky bottom-0 bg-slate-950 py-2">
                        <button onClick={() => addBlock('text', page.blocks as Block[], setPageBlocks)} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 rounded text-xs font-bold flex items-center gap-1"><Type className="w-3 h-3"/> Texto / Ecuaciones</button>
                        <button onClick={() => addBlock('image', page.blocks as Block[], setPageBlocks)} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-700 rounded text-xs font-bold flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Imagen</button>
                        <button onClick={() => addBlock('box', page.blocks as Block[], setPageBlocks)} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 rounded text-xs font-bold flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Recuadro</button>
                        <button onClick={() => addBlock('row', page.blocks as Block[], setPageBlocks)} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-purple-400 hover:bg-slate-700 rounded text-xs font-bold flex items-center gap-1"><Columns className="w-3 h-3"/> Fila</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="max-w-4xl mx-auto flex justify-center pb-12">
                <button onClick={() => setPages([...pages, { id: generateId(), blocks: [] }])} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-700 hover:border-slate-500 transition-colors shadow-lg">
                  <Plus className="w-5 h-5" /> Añadir Nueva Hoja
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/50">
            <FileText className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-lg font-bold">Selecciona o crea un dossier</p>
          </div>
        )}
      </div>

    </div>
  );
}
