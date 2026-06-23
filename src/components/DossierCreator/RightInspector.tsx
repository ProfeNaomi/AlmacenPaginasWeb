import React from 'react';
import { Settings2 } from 'lucide-react';

export default function RightInspector() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 shrink-0 flex items-center space-x-2">
        <Settings2 className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Inspector</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center text-slate-500 text-sm mt-8 border border-slate-700 rounded-xl p-4 bg-slate-900/50">
          <p>Selecciona un elemento en el lienzo para editar sus propiedades.</p>
        </div>
      </div>
    </div>
  );
}
