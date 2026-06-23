import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function Canvas() {
  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-900">
      <div className="max-w-4xl mx-auto min-h-[80vh] border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-800/50">
        <LayoutGrid className="w-12 h-12 mb-4 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Lienzo del Dosier</h2>
        <p className="text-sm text-center max-w-sm">
          Arrastra y suelta elementos desde la biblioteca aquí. Puedes reordenarlos libremente para construir tu dosier.
        </p>
      </div>
    </div>
  );
}
