import React from 'react';
import { X } from 'lucide-react';

const SHAPES = [
  { name: 'Cilindro', svg: '<svg width="100" height="150" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"><path d="M10,30 Q50,0 90,30 L90,120 Q50,150 10,120 Z" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="50" cy="30" rx="40" ry="15" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
  { name: 'Cono', svg: '<svg width="100" height="150" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"><path d="M50,10 L10,120 Q50,150 90,120 Z" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="50" cy="120" rx="40" ry="15" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5,5"/></svg>' },
  { name: 'Cubo', svg: '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M30,30 L70,30 L70,70 L30,70 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M50,10 L90,10 L90,50 L70,70 M90,10 L70,30 M50,10 L30,30 M50,50 L90,50 M50,10 L50,50 L30,70" fill="none" stroke="currentColor" stroke-width="2"/><path d="M50,50 L70,50" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
  { name: 'Esfera', svg: '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5,5"/><path d="M50,10 A 15 40 0 0 1 50 90" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5,5"/></svg>' },
  { name: 'Campana de Gauss', svg: '<svg width="150" height="100" viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg"><path d="M10,90 Q40,90 60,50 T75,10 T90,50 T140,90" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="90" x2="140" y2="90" stroke="currentColor" stroke-width="2"/></svg>' },
  { name: 'Gráfico de Barras', svg: '<svg width="150" height="100" viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg"><line x1="20" y1="10" x2="20" y2="90" stroke="currentColor" stroke-width="2"/><line x1="20" y1="90" x2="140" y2="90" stroke="currentColor" stroke-width="2"/><rect x="30" y="50" width="20" height="40" fill="none" stroke="currentColor" stroke-width="2"/><rect x="60" y="30" width="20" height="60" fill="none" stroke="currentColor" stroke-width="2"/><rect x="90" y="60" width="20" height="30" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
  { name: 'Ejes Cartesianos', svg: '<svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg"><line x1="75" y1="10" x2="75" y2="140" stroke="currentColor" stroke-width="2"/><line x1="10" y1="75" x2="140" y2="75" stroke="currentColor" stroke-width="2"/><path d="M70,15 L75,10 L80,15 M135,70 L140,75 L135,80" fill="none" stroke="currentColor" stroke-width="2"/></svg>' }
];

interface Props {
  onInsert: (html: string, isImage: boolean) => void;
  onClose: () => void;
}

export default function ShapeSelectorModal({ onInsert, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Figuras Geométricas y Estadísticas
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh]">
          {SHAPES.map((shape, idx) => (
            <button
              key={idx}
              onClick={() => onInsert(`<div contenteditable="false" style="display:inline-block; margin: 10px; color: black;">${shape.svg}</div>&nbsp;`, false)}
              className="flex flex-col items-center gap-3 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 transition-all hover:scale-105 group text-slate-300 hover:text-cyan-400"
            >
              <div className="w-16 h-16 flex items-center justify-center" dangerouslySetInnerHTML={{__html: shape.svg}} />
              <span className="text-sm font-bold text-center">{shape.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
