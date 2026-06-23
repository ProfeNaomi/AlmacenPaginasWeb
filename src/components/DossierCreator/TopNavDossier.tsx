import React from 'react';
import { Download, ChevronRight, Share2 } from 'lucide-react';

export default function TopNavDossier() {
  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0 shadow-md">
      <div className="flex items-center space-x-2 text-sm text-slate-400">
        <span className="hover:text-slate-200 cursor-pointer">Workspace</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-100 font-medium">Nuevo Dosier</span>
      </div>
      <div className="flex items-center space-x-3">
        <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors shadow-md border border-slate-600">
          <Share2 className="w-4 h-4" />
          <span>Compartir</span>
        </button>
        <button className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors shadow-md">
          <Download className="w-4 h-4" />
          <span>Exportar PDF</span>
        </button>
      </div>
    </header>
  );
}
