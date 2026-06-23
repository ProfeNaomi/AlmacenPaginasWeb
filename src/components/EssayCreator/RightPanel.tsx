import React from 'react';

export default function RightPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12">
      <div className="max-w-prose mx-auto">
        <input 
          type="text" 
          placeholder="Título del Ensayo" 
          className="w-full text-4xl font-bold bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-600 mb-8"
        />
        <div className="prose prose-invert prose-slate max-w-none">
          <textarea
            placeholder="Empieza a escribir aquí..."
            className="w-full min-h-[60vh] resize-none bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-600 leading-relaxed"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
