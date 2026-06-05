import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { X, Check } from 'lucide-react';

interface EquationEditorModalProps {
  onInsert: (latex: string) => void;
  onClose: () => void;
}

const symbols = [
  { latex: '\\pm', display: '±' }, { latex: '\\infty', display: '∞' }, { latex: '=', display: '=' }, { latex: '\\neq', display: '≠' },
  { latex: '\\approx', display: '≈' }, { latex: '\\sim', display: '~' }, { latex: '\\times', display: '×' }, { latex: '\\div', display: '÷' },
  { latex: '!', display: '!' }, { latex: '\\propto', display: '∝' }, { latex: '<', display: '<' }, { latex: '\\ll', display: '≪' },
  { latex: '>', display: '>' }, { latex: '\\gg', display: '≫' }, { latex: '\\le', display: '≤' }, { latex: '\\ge', display: '≥' },
  { latex: '\\mp', display: '∓' }, { latex: '\\cong', display: '≅' }, { latex: '\\equiv', display: '≡' }, { latex: '\\forall', display: '∀' },
  { latex: '\\partial', display: '∂' }, { latex: '\\sqrt{}', display: '√' }, { latex: '\\cup', display: '∪' }, { latex: '\\cap', display: '∩' },
  { latex: '\\emptyset', display: '∅' }, { latex: '\\%', display: '%' }, { latex: '^\\circ', display: '°' }, { latex: '\\Delta', display: 'Δ' },
  { latex: '\\nabla', display: '∇' }, { latex: '\\exists', display: '∃' }, { latex: '\\in', display: '∈' }, { latex: '\\leftarrow', display: '←' },
  { latex: '\\uparrow', display: '↑' }, { latex: '\\rightarrow', display: '→' }, { latex: '\\downarrow', display: '↓' }
];

const structures = [
  { latex: '\\frac{x}{y}', name: 'Fracción', display: '\\frac{x}{y}' },
  { latex: 'x^{2}', name: 'Exponente', display: 'x^2' },
  { latex: 'x_{1}', name: 'Subíndice', display: 'x_1' },
  { latex: '\\sqrt{x}', name: 'Raíz cuadrada', display: '\\sqrt{x}' },
  { latex: '\\sqrt[n]{x}', name: 'Raíz n-ésima', display: '\\sqrt[n]{x}' },
  { latex: '\\int_{a}^{b} x \\,dx', name: 'Integral', display: '\\int_a^b' },
  { latex: '\\sum_{i=1}^{n} x_i', name: 'Sumatoria', display: '\\sum' },
  { latex: '\\prod_{i=1}^{n} x_i', name: 'Productoria', display: '\\prod' },
  { latex: '\\lim_{x \\to \\infty}', name: 'Límite', display: '\\lim' },
  { latex: '\\sin(x)', name: 'Seno', display: '\\sin' },
  { latex: '\\cos(x)', name: 'Coseno', display: '\\cos' },
  { latex: '\\begin{matrix} a & b \\\\ c & d \\end{matrix}', name: 'Matriz 2x2', display: '\\begin{matrix}a&b\\\\c&d\\end{matrix}' },
  { latex: '\\left( x \\right)', name: 'Paréntesis', display: '( )' },
  { latex: '\\left[ x \\right]', name: 'Corchetes', display: '[ ]' },
];

export default function EquationEditorModal({ onInsert, onClose }: EquationEditorModalProps) {
  const [latex, setLatex] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      if (latex.trim()) {
        const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
        setPreviewHtml(html);
      } else {
        setPreviewHtml('');
      }
    } catch (e) {
      // Ignore intermediate parsing errors
    }
  }, [latex]);

  const insertAtCursor = (text: string) => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const current = latex;
    const updated = current.substring(0, start) + text + current.substring(end);
    setLatex(updated);
    
    // Set focus back and adjust cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + text.length, start + text.length);
      }
    }, 0);
  };

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white font-display">Editor de Ecuaciones Avanzado</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500/80 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Area */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 overflow-y-auto max-h-60">
          
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Símbolos Matemáticos</h3>
            <div className="flex flex-wrap gap-2">
              {symbols.map((sym, i) => (
                <button
                  key={i}
                  onClick={() => insertAtCursor(sym.latex)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-400 hover:border-cyan-500/50 border border-slate-700 rounded-lg text-lg text-slate-300 transition-all"
                  title={sym.latex}
                >
                  {sym.display}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estructuras</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {structures.map((struct, i) => (
                <button
                  key={i}
                  onClick={() => insertAtCursor(struct.latex)}
                  className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-400 hover:border-cyan-500/50 border border-slate-700 rounded-lg transition-all"
                  title={struct.name}
                >
                  <span className="text-xs text-slate-400 mb-2">{struct.name}</span>
                  <div dangerouslySetInnerHTML={{ __html: katex.renderToString(struct.display, { throwOnError: false }) }} className="text-slate-200" />
                </button>
              ))}
            </div>
          </div>
          
        </div>

        {/* Input & Preview Area */}
        <div className="p-6 flex flex-col md:flex-row gap-6 flex-1 min-h-[200px]">
          
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-bold text-slate-400 mb-2">Código LaTeX</label>
            <textarea
              ref={inputRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Escribe tu fórmula aquí o usa los botones de arriba..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-sm font-bold text-slate-400 mb-2">Vista Previa</label>
            <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex items-center justify-center overflow-auto min-h-[150px]">
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="text-xl text-white" />
              ) : (
                <span className="text-slate-600">La vista previa aparecerá aquí</span>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleInsert}
            disabled={!latex.trim()}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/20"
          >
            <Check className="w-5 h-5" /> Insertar Fórmula
          </button>
        </div>

      </div>
    </div>
  );
}
