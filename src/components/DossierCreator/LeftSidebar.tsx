import React from 'react';
import { Folder, Image as ImageIcon, FileText, Search } from 'lucide-react';

export default function LeftSidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Biblioteca</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar activos..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Placeholder Items */}
        <AssetItem icon={<FileText className="w-4 h-4 text-emerald-400" />} name="Resumen_Ejecutivo.md" />
        <AssetItem icon={<ImageIcon className="w-4 h-4 text-sky-400" />} name="Grafico_Ventas_Q3.png" />
        <AssetItem icon={<Folder className="w-4 h-4 text-amber-400" />} name="Material de Referencia" isFolder />
      </div>
    </div>
  );
}

function AssetItem({ icon, name, isFolder = false }: { icon: React.ReactNode, name: string, isFolder?: boolean }) {
  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-slate-700/50 rounded-xl cursor-grab active:cursor-grabbing transition-colors border border-transparent hover:border-slate-600">
      <div className="bg-slate-900 p-2 rounded-lg shrink-0">
        {icon}
      </div>
      <span className="text-sm text-slate-300 truncate font-medium">{name}</span>
    </div>
  );
}
