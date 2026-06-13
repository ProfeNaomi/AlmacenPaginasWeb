import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, List, CaseUpper, CaseLower, Space, ListOrdered, Indent, Outdent, Palette, Underline, AlignCenter, AlignRight, AlignJustify, AlignLeft, Sigma, Image as ImageIcon, Eraser, Highlighter, Table, Shapes
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import EquationEditorModal from '../EquationEditorModal';
import ShapeSelectorModal from '../ShapeSelectorModal';

const ImageResizeOverlay = ({ image, onChange }: { image: HTMLImageElement, onChange: () => void }) => {
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const updateRect = () => {
      if (!image || !(image instanceof Element) || !image.isConnected) return;
      setRect({
        top: image.offsetTop,
        left: image.offsetLeft,
        width: image.offsetWidth,
        height: image.offsetHeight,
      });
    };
    updateRect();
    
    let ro: ResizeObserver | null = null;
    try {
      if (image && image instanceof Element) {
        ro = new ResizeObserver(updateRect);
        ro.observe(image);
      }
    } catch (err) {
      console.warn("ResizeObserver error:", err);
    }
    
    return () => {
      if (ro) ro.disconnect();
    };
  }, [image]);

  const handleMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = image.offsetWidth;
    const startHeight = image.offsetHeight;
    const ratio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      
      if (corner.includes('right')) newWidth = startWidth + dx;
      if (corner.includes('left')) newWidth = startWidth - dx;

      // Keep aspect ratio
      const newHeight = newWidth / ratio;
      
      image.style.width = `${newWidth}px`;
      image.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onChange();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handles = [
    { id: 'top-left', cursor: 'nwse-resize', top: -5, left: -5 },
    { id: 'top-right', cursor: 'nesw-resize', top: -5, right: -5 },
    { id: 'bottom-left', cursor: 'nesw-resize', bottom: -5, left: -5 },
    { id: 'bottom-right', cursor: 'nwse-resize', bottom: -5, right: -5 },
    { id: 'right', cursor: 'ew-resize', top: '50%', right: -5, marginTop: -5 },
    { id: 'bottom', cursor: 'ns-resize', bottom: -5, left: '50%', marginLeft: -5 }
  ];

  return (
    <div 
      className="absolute border border-blue-500 z-10 pointer-events-none"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      {handles.map(h => (
        <div 
          key={h.id}
          className="absolute w-2.5 h-2.5 bg-blue-500 border border-white pointer-events-auto"
          style={{ ...h, cursor: h.cursor }}
          onMouseDown={(e) => handleMouseDown(e, h.id)}
        />
      ))}
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, theme = 'dark' }: { content: string, onChange: (val: string) => void, theme?: 'dark' | 'light' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [lineSpacing, setLineSpacing] = useState<'normal' | 'relaxed' | 'loose'>('normal');
  const [showEquationEditor, setShowEquationEditor] = useState(false);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

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

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      setSelectedImage(e.target as HTMLImageElement);
    } else {
      setSelectedImage(null);
    }
  };

  const format = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    document.execCommand(command, false, value);
    handleInput();
  };

  const openModal = (e: React.MouseEvent, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
    setter(true);
  };

  const restoreSelectionAndInsert = (insertFn: () => void) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange);
      }
      insertFn();
      handleInput();
    }
  };

  const handleInsertEquation = (tex: string) => {
    setShowEquationEditor(false);
    restoreSelectionAndInsert(() => {
      try {
        const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
        const span = `<span class="math-tex inline-block mx-1 align-middle" contenteditable="false">${html}</span>&nbsp;`;
        document.execCommand('insertHTML', false, span);
      } catch (err) {
        alert("Error en el formato LaTeX");
      }
    });
  };

  const handleInsertShape = (urlOrSvg: string, isImage: boolean = true) => {
    setShowShapeSelector(false);
    restoreSelectionAndInsert(() => {
      if (isImage) {
        document.execCommand('insertImage', false, urlOrSvg);
      } else {
        document.execCommand('insertHTML', false, urlOrSvg);
      }
    });
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

  const insertTable = (e: React.MouseEvent, rows: number, cols: number) => {
    e.preventDefault();
    let tableHTML = '<table style="width: 100%; border-collapse: collapse; border: 2px solid #334155; margin: 10px 0;"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHTML += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHTML += '<td style="border: 1px solid #475569; padding: 8px; min-width: 50px;">&nbsp;</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p><br/></p>';
    document.execCommand('insertHTML', false, tableHTML);
    handleInput();
  };

  const toggleSpacing = (e: React.MouseEvent) => {
    e.preventDefault();
    setLineSpacing(prev => prev === 'normal' ? 'relaxed' : prev === 'relaxed' ? 'loose' : 'normal');
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    document.execCommand('fontName', false, e.target.value);
    handleInput();
  };

  const isLight = theme === 'light';

  return (
    <div className={`border rounded-lg overflow-hidden relative focus-within:border-cyan-500 transition-colors ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
      <style>{`
        .editor-content img { 
          max-width: 100%;
          display: inline-block;
          vertical-align: middle;
        }
      `}</style>
      <div className={`flex items-center gap-1 p-2 border-b flex-wrap ${isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
        <button type="button" onMouseDown={(e) => format(e, 'formatBlock', 'H1')} className={`p-1.5 rounded text-xs font-bold transition-colors ${isLight ? 'hover:bg-slate-300 text-slate-700' : 'hover:bg-slate-700 text-slate-300'}`} title="Título 1">H1</button>
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

        {/* Tablas dropdown (3x3, 4x4) */}
        <div className="relative group flex items-center">
          <button type="button" className="p-1.5 hover:bg-purple-600/50 bg-purple-900/30 text-purple-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Insertar Tabla">
            <Table className="w-4 h-4" /> Tabla
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
            <button type="button" onMouseDown={(e) => insertTable(e, 2, 2)} className="block w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 text-xs">Tabla 2x2</button>
            <button type="button" onMouseDown={(e) => insertTable(e, 3, 3)} className="block w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 text-xs">Tabla 3x3</button>
            <button type="button" onMouseDown={(e) => insertTable(e, 4, 4)} className="block w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 text-xs">Tabla 4x4</button>
          </div>
        </div>

        <button type="button" onMouseDown={(e) => openModal(e, setShowShapeSelector)} className="p-1.5 hover:bg-orange-600/50 bg-orange-900/30 text-orange-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Figuras Geométricas y Estadísticas">
          <Shapes className="w-4 h-4" /> Figuras
        </button>

        <button type="button" onMouseDown={insertImage} className="p-1.5 hover:bg-blue-600/50 bg-blue-900/30 text-blue-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Insertar Imagen desde URL o carpeta public">
          <ImageIcon className="w-4 h-4" /> Img
        </button>
        <button type="button" onMouseDown={(e) => openModal(e, setShowEquationEditor)} className="p-1.5 hover:bg-emerald-600/50 bg-emerald-900/30 text-emerald-400 rounded transition-colors font-bold flex items-center gap-1 text-xs" title="Insertar Ecuación (LaTeX)">
          <Sigma className="w-4 h-4" /> LaTeX
        </button>

        {selectedImage && (
          <>
            <div className="w-px h-4 bg-slate-600 mx-1"></div>
            <div className="flex bg-blue-900/20 rounded p-0.5 border border-blue-500/30 gap-1 items-center">
              <span className="text-[10px] text-blue-300 font-bold px-1 hidden md:inline">Imagen:</span>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectedImage.style.position = 'static'; selectedImage.style.float = 'left'; selectedImage.style.margin = '0 15px 15px 0'; selectedImage.style.display = 'block'; handleInput(); }} className="text-[10px] bg-slate-700 hover:bg-cyan-600 text-white px-2 py-1 rounded" title="Alinear a la izquierda">Izq</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectedImage.style.position = 'static'; selectedImage.style.float = 'none'; selectedImage.style.margin = '0 auto 15px auto'; selectedImage.style.display = 'block'; handleInput(); }} className="text-[10px] bg-slate-700 hover:bg-cyan-600 text-white px-2 py-1 rounded" title="Centrar">Centro</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectedImage.style.position = 'static'; selectedImage.style.float = 'right'; selectedImage.style.margin = '0 0 15px 15px'; selectedImage.style.display = 'block'; handleInput(); }} className="text-[10px] bg-slate-700 hover:bg-cyan-600 text-white px-2 py-1 rounded" title="Alinear a la derecha">Der</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectedImage.style.position = 'static'; selectedImage.style.float = 'none'; selectedImage.style.display = 'inline-block'; selectedImage.style.margin = '0'; handleInput(); }} className="text-[10px] bg-slate-700 hover:bg-cyan-600 text-white px-2 py-1 rounded" title="Como carácter">En Línea</button>
              
              <div className="w-px h-4 bg-slate-600 mx-1"></div>
              
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectedImage.style.position = 'absolute'; selectedImage.style.zIndex = '10'; handleInput(); }} className="text-[10px] bg-purple-900/50 hover:bg-purple-600 text-white px-2 py-1 rounded border border-purple-700" title="Delante del texto">Frente</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectedImage.style.position = 'absolute'; selectedImage.style.zIndex = '-1'; handleInput(); }} className="text-[10px] bg-purple-900/50 hover:bg-purple-600 text-white px-2 py-1 rounded border border-purple-700" title="Detrás del texto">Atrás</button>
            </div>
          </>
        )}
      </div>
      <div 
        ref={editorRef}
        onClick={handleEditorClick}
        className={`editor-content p-4 min-h-[120px] outline-none prose max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl
          ${isLight ? 'prose-slate text-slate-900' : 'prose-invert text-slate-300'}
          ${lineSpacing === 'relaxed' ? 'leading-relaxed' : lineSpacing === 'loose' ? 'leading-loose' : 'leading-normal'}
        `}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
      />

      {selectedImage && <ImageResizeOverlay image={selectedImage} onChange={handleInput} />}

      {showEquationEditor && (
        <EquationEditorModal 
          onInsert={handleInsertEquation} 
          onClose={() => setShowEquationEditor(false)} 
        />
      )}
      {showShapeSelector && (
        <ShapeSelectorModal 
          onInsert={handleInsertShape} 
          onClose={() => setShowShapeSelector(false)} 
        />
      )}
    </div>
  );
};

export default RichTextEditor;
