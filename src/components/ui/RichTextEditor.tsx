import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, List, CaseUpper, CaseLower, Space, ListOrdered, Indent, Outdent, Palette, Underline, AlignCenter, AlignRight, AlignJustify, AlignLeft, Sigma, Image as ImageIcon, Eraser, Highlighter
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import EquationEditorModal from '../EquationEditorModal';

export const RichTextEditor = ({ content, onChange }: { content: string, onChange: (val: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [lineSpacing, setLineSpacing] = useState<'normal' | 'relaxed' | 'loose'>('normal');

  useEffect(() => {
    if (editorRef.current && !isReady) {
      editorRef.current.innerHTML = content || '';
      setIsReady(true);
    }
  }, [content, isReady]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const format = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    document.execCommand(command, false, value);
    handleInput();
  };

  const [showEquationEditor, setShowEquationEditor] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const openEquationEditor = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
    setShowEquationEditor(true);
  };

  const handleInsertEquation = (tex: string) => {
    setShowEquationEditor(false);
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange);
      }
      try {
        const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
        const span = `<span class="math-tex inline-block mx-1 align-middle" contenteditable="false">${html}</span>&nbsp;`;
        document.execCommand('insertHTML', false, span);
        handleInput();
      } catch (err) {
        alert("Error en el formato LaTeX");
      }
    }
  };

  const insertImage = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = prompt("Ingresa la ruta de la imagen (ej: /paes_2026/p2.png) o una URL externa:");
    if (url) {
      document.execCommand('insertImage', false, url);
      handleInput();
    }
  };

  const transformCase = (e: React.MouseEvent, type: 'upper' | 'lower') => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const text = selection.toString();
    if (text) {
      document.execCommand('insertText', false, type === 'upper' ? text.toUpperCase() : text.toLowerCase());
      handleInput();
    }
  };

  const toggleSpacing = (e: React.MouseEvent) => {
    e.preventDefault();
    setLineSpacing(prev => prev === 'normal' ? 'relaxed' : prev === 'relaxed' ? 'loose' : 'normal');
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    document.execCommand('fontName', false, e.target.value);
    handleInput();
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 focus-within:border-cyan-500 transition-colors">
      <style>{`
        .editor-content img { 
          resize: both; 
          overflow: hidden; 
          max-width: 100%;
          cursor: se-resize;
          border: 2px dashed transparent;
          display: inline-block;
          vertical-align: middle;
        }
        .editor-content img:hover {
          border-color: #06b6d4;
        }
      `}</style>
      <div className="flex items-center gap-1 p-2 bg-slate-800 border-b border-slate-700 flex-wrap">
        <button type="button" onMouseDown={(e) => format(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors" title="Título 1">H1</button>
        <button type="button" onMouseDown={(e) => format(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors" title="Título 2">H2</button>
        <button type="button" onMouseDown={(e) => format(e, 'formatBlock', 'H3')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold transition-colors" title="Título 3">H3</button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>
        
        <button type="button" onMouseDown={(e) => format(e, 'bold')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Negrita"><Bold className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => format(e, 'underline')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Subrayado"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={(e) => format(e, 'fontSize', '2')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold" title="Letra Pequeña">A-</button>
        <button type="button" onMouseDown={(e) => format(e, 'fontSize', '3')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold" title="Letra Normal">A</button>
        <button type="button" onMouseDown={(e) => format(e, 'fontSize', '5')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold" title="Letra Grande">A+</button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={(e) => transformCase(e, 'upper')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Mayúsculas"><CaseUpper className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => transformCase(e, 'lower')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Minúsculas"><CaseLower className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={(e) => format(e, 'justifyLeft')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Alinear Izquierda"><AlignLeft className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => format(e, 'justifyCenter')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Centrar"><AlignCenter className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => format(e, 'justifyRight')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Alinear Derecha"><AlignRight className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => format(e, 'justifyFull')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Justificar"><AlignJustify className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={(e) => format(e, 'insertUnorderedList')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Lista Viñetas"><List className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => format(e, 'insertOrderedList')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Lista Numerada"><ListOrdered className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={(e) => format(e, 'indent')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Aumentar Sangría"><Indent className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => format(e, 'outdent')} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Reducir Sangría"><Outdent className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <select 
          onChange={handleFontChange} 
          className="bg-slate-700 text-slate-300 text-xs rounded border border-slate-600 p-1 outline-none"
          title="Tipo de Letra"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <div className="relative group">
          <button type="button" className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center" title="Color de Texto"><Palette className="w-4 h-4" /></button>
          <input type="color" onInput={(e) => { document.execCommand('foreColor', false, (e.target as HTMLInputElement).value); handleInput(); }} className="absolute top-0 left-0 w-8 h-8 opacity-0 cursor-pointer" />
        </div>
        <div className="relative group">
          <button type="button" className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center" title="Color de Fondo (Resaltar)"><Highlighter className="w-4 h-4" /></button>
          <input type="color" onInput={(e) => { document.execCommand('hiliteColor', false, (e.target as HTMLInputElement).value); handleInput(); }} className="absolute top-0 left-0 w-8 h-8 opacity-0 cursor-pointer" />
        </div>
        <button type="button" onMouseDown={(e) => format(e, 'removeFormat')} className="p-1.5 hover:bg-red-900/50 hover:text-red-400 rounded text-slate-300 transition-colors" title="Limpiar Formato (Quita color de fondo/texto)"><Eraser className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={toggleSpacing} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors" title="Interlineado"><Space className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>

        <button type="button" onMouseDown={insertImage} className="p-1.5 hover:bg-blue-600/50 bg-blue-900/30 text-blue-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Insertar Imagen desde URL o carpeta public">
          <ImageIcon className="w-4 h-4" /> Img
        </button>
        <button type="button" onMouseDown={openEquationEditor} className="p-1.5 hover:bg-emerald-600/50 bg-emerald-900/30 text-emerald-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Insertar Ecuación (LaTeX)">
          <Sigma className="w-4 h-4" /> LaTeX
        </button>
      </div>
      <div 
        ref={editorRef}
        className={`editor-content p-4 min-h-[120px] text-slate-300 outline-none prose prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl
          ${lineSpacing === 'relaxed' ? 'leading-relaxed' : lineSpacing === 'loose' ? 'leading-loose' : 'leading-normal'}
        `}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
      />
      {showEquationEditor && (
        <EquationEditorModal 
          onInsert={handleInsertEquation} 
          onClose={() => setShowEquationEditor(false)} 
        />
      )}
    </div>
  );
};

export default RichTextEditor;
