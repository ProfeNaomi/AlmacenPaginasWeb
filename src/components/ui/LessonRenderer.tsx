import React, { useState } from 'react';
import { Block } from '../../lib/courses';
import { CheckCircle2, XCircle, X, Maximize2, ChevronDown, FileQuestion, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomAppRenderer } from '../apps/AppRegistry';

export const ZoomModal = ({ url, onClose }: { url: string, onClose: () => void }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-red-500/80 p-2 rounded-full transition-all"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <img 
        src={url} 
        alt="Zoom" 
        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
};

export const InteractiveChallenge: React.FC<{ block: Block }> = ({ block }) => {
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div className="my-6 border-2 border-emerald-600 rounded-2xl overflow-hidden shadow-lg bg-emerald-950/20">
      <div className="bg-emerald-600 text-white px-6 py-3 font-display font-bold text-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" /> Desafío Matemático
      </div>
      <div className="p-6 prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: block.content || '' }} />
      {block.solution && (
        <div className="px-6 pb-6">
          <button 
            onClick={() => setShowSolution(!showSolution)}
            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-4 py-2 rounded-lg font-bold transition-colors w-full sm:w-auto border border-emerald-800"
          >
            {showSolution ? 'Ocultar Desarrollo' : 'Ver Desarrollo Paso a Paso'}
          </button>
          {showSolution && (
            <div className="mt-4 p-6 bg-emerald-900/40 rounded-xl border border-emerald-800 prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: block.solution }} />
          )}
        </div>
      )}
    </div>
  );
};

export const InteractiveTabs: React.FC<{ block: Block }> = ({ block }) => {
  const [activeTab, setActiveTab] = useState(0);
  if (!block.tabsContent || block.tabsContent.length === 0) return null;
  return (
    <div className="my-6 border border-slate-700 rounded-2xl overflow-hidden shadow-lg bg-slate-900">
      <div className="flex overflow-x-auto border-b border-slate-700 bg-slate-950 no-scrollbar">
        {block.tabsContent.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(idx)}
            className={`px-6 py-4 font-bold whitespace-nowrap transition-colors ${activeTab === idx ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="p-6 prose prose-invert prose-cyan max-w-none bg-slate-900">
        <div dangerouslySetInnerHTML={{ __html: block.tabsContent[activeTab].content }} />
      </div>
    </div>
  );
};

export const InteractiveAccordion: React.FC<{ block: Block }> = ({ block }) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleItem = (id: string) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));

  if (!block.accordionItems || block.accordionItems.length === 0) return null;
  return (
    <div className="my-6 space-y-3">
      {block.accordionItems.map(item => (
        <div key={item.id} className="border border-slate-700 rounded-xl overflow-hidden shadow-md bg-slate-900">
          <button 
            onClick={() => toggleItem(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {item.title}
            <ChevronDown className={`w-5 h-5 transition-transform ${openItems[item.id] ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
          </button>
          {openItems[item.id] && (
            <div className="p-6 border-t border-slate-800 prose prose-invert prose-cyan max-w-none bg-slate-950/50" dangerouslySetInnerHTML={{ __html: item.content }} />
          )}
        </div>
      ))}
    </div>
  );
};

export const InlineQuizBlock: React.FC<{ block: Block }> = ({ block }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  if (!block.quizData) return null;
  const isCorrect = selected === block.quizData.correctIndex;

  return (
    <div className="my-6 border-2 border-slate-700 rounded-2xl p-6 bg-slate-900 shadow-lg">
      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <FileQuestion className="w-6 h-6 text-yellow-400" /> {block.quizData.question}
      </h4>
      <div className="space-y-3">
        {block.quizData.options.map((opt, idx) => {
          let btnClass = "w-full text-left px-5 py-4 rounded-xl border transition-all ";
          if (!isSubmitted) {
            btnClass += selected === idx ? "bg-cyan-900/40 border-cyan-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700";
          } else {
            if (idx === block.quizData!.correctIndex) {
              btnClass += "bg-emerald-900/40 border-emerald-500 text-white";
            } else if (selected === idx && !isCorrect) {
              btnClass += "bg-red-900/40 border-red-500 text-white";
            } else {
              btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed";
            }
          }

          return (
            <button 
              key={idx}
              disabled={isSubmitted}
              onClick={() => setSelected(idx)}
              className={btnClass}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {isSubmitted && idx === block.quizData!.correctIndex && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isSubmitted && selected === idx && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>
      {!isSubmitted && selected !== null && (
        <button 
          onClick={() => setIsSubmitted(true)}
          className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg"
        >
          Comprobar Respuesta
        </button>
      )}
      {isSubmitted && (
        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-bold ${isCorrect ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
          {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          {isCorrect ? '¡Correcto! Excelente trabajo.' : 'Incorrecto. Intenta repasar el contenido y vuelve a intentarlo.'}
        </div>
      )}
    </div>
  );
};

export const StepByStepBlock: React.FC<{ block: Block }> = ({ block }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!block.stepBlocks || block.stepBlocks.length === 0) return null;

  return (
    <div className="my-6 border-2 border-purple-600/30 rounded-2xl overflow-hidden shadow-lg bg-slate-900">
      <div className="bg-purple-900/40 text-purple-200 px-6 py-3 font-display font-bold text-lg flex items-center justify-between border-b border-purple-800/50">
        <span>Revelación Paso a Paso</span>
        <span className="text-sm font-medium opacity-80">Paso {currentStep + 1} de {block.stepBlocks.length}</span>
      </div>
      <div className="p-6 space-y-4">
        {block.stepBlocks.map((stepBlock: Block, index: number) => {
          if (index > currentStep) return null;
          return (
            <motion.div 
              key={stepBlock.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <LessonRenderer block={stepBlock} onZoom={() => {}} />
            </motion.div>
          );
        })}

        {currentStep < block.stepBlocks.length - 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-6"
          >
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-900/30 transition-all"
            >
              Siguiente Paso <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export const getEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/');
  }
  return url;
};

export const LessonRenderer: React.FC<{ block: Block, onZoom: (url: string) => void }> = ({ block, onZoom }) => {
  if (block.type === 'row') {
    return (
      <div key={block.id} className="flex flex-col md:flex-row gap-6 w-full my-6">
        {block.columns?.map(col => (
          <div key={col.id} className="flex-1 space-y-6">
            {col.blocks.map(subBlock => (
              <LessonRenderer key={subBlock.id} block={subBlock as Block} onZoom={onZoom} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (block.type === 'box') {
    const themes = {
      history: { header: 'bg-[#784d2f] text-white', body: 'bg-[#fbf4ea] border-[#784d2f] text-slate-900', prose: 'prose-slate' },
      situation: { header: 'bg-[#1b7330] text-white', body: 'bg-[#f0f8f2] border-[#1b7330] text-slate-900', prose: 'prose-slate' },
      formula: { header: 'bg-purple-700 text-white', body: 'bg-purple-50 border-purple-700 text-slate-900', prose: 'prose-slate' },
      exercise: { header: 'bg-teal-800 text-white', body: 'bg-teal-50 border-teal-800 text-slate-900', prose: 'prose-slate' },
      warning: { header: 'bg-red-700 text-white', body: 'bg-red-50 border-red-700 text-slate-900', prose: 'prose-slate' },
      theorem: { header: 'bg-cyan-900 text-cyan-50 border-l-8 border-cyan-500', body: 'bg-slate-900 border-l-8 border-cyan-500 text-slate-300', prose: 'prose-invert prose-cyan' },
      alert: { header: 'bg-orange-900 text-orange-50 border-l-8 border-orange-500', body: 'bg-slate-900 border-l-8 border-orange-500 text-slate-300', prose: 'prose-invert prose-orange' }
    };
    const theme = themes[block.theme as keyof typeof themes || 'history'];
    return (
      <div key={block.id} className={`my-6 rounded-2xl overflow-hidden border-2 ${theme.body} shadow-lg`}>
        {block.title && (
          <div className={`${theme.header} px-6 py-3 font-display font-bold text-lg`}>
            {block.title}
          </div>
        )}
        <div 
          className={`p-6 prose max-w-none ${theme.prose} prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl`}
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      </div>
    );
  }
  if (block.type === 'text') {
    return (
      <div 
        key={block.id} 
        className="prose prose-invert prose-cyan max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl sm:prose-h1:text-5xl prose-h2:text-3xl sm:prose-h2:text-4xl prose-h3:text-2xl sm:prose-h3:text-3xl text-slate-300 my-4"
        dangerouslySetInnerHTML={{ __html: block.content || '' }}
      />
    );
  }
  if (block.type === 'image') {
    return (
      <div key={block.id} className="relative group mx-auto my-4 w-full">
        <img 
          src={block.url} 
          alt="" 
          className={`rounded-2xl w-full shadow-lg border border-slate-800 ${block.zoom ? 'cursor-zoom-in hover:border-cyan-500/50 transition-colors' : ''}`} 
          onClick={() => block.zoom && block.url && onZoom(block.url)}
        />
        {block.zoom && (
          <div className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Maximize2 className="w-5 h-5" />
          </div>
        )}
      </div>
    );
  }
  if (block.type === 'video') {
    return (
      <div key={block.id} className="my-8 w-full mx-auto max-w-5xl">
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black">
          <iframe 
            src={getEmbedUrl(block.url || '')} 
            className="w-full h-full border-0" 
            allowFullScreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
        {block.caption && (
          <p className="text-center text-slate-400 text-sm mt-3 font-medium italic">
            {block.caption}
          </p>
        )}
      </div>
    );
  }
  
  if (block.type === 'app') {
    // Manejo de local apps vs iframes
    if (block.url && block.url.startsWith('local:')) {
      const ComponentName = block.url.replace('local:', '');
      return (
        <div key={block.id} className={`my-8 w-full flex ${block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center'}`}>
          <div className="w-full" style={{ maxWidth: block.width || '100%' }}>
            <CustomAppRenderer name={ComponentName} />
          </div>
        </div>
      );
    }
    
    return (
      <div key={block.id} className={`my-8 w-full flex ${block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center'}`}>
        <div 
          className={`bg-black border border-slate-800 ${block.rounded !== false ? 'rounded-2xl' : ''} ${block.shadow !== false ? 'shadow-2xl shadow-emerald-900/20' : ''} overflow-hidden`}
          style={{ height: `${block.height || 500}px`, width: block.width || '100%', maxWidth: '100%' }}
        >
          <iframe 
            src={block.url || ''} 
            className="w-full h-full border-0" 
            allowFullScreen 
          ></iframe>
        </div>
      </div>
    );
  }

  if (block.type === 'challenge') return <InteractiveChallenge key={block.id} block={block} />;
  if (block.type === 'tabs') return <InteractiveTabs key={block.id} block={block} />;
  if (block.type === 'accordion') return <InteractiveAccordion key={block.id} block={block} />;
  if (block.type === 'inline-quiz') return <InlineQuizBlock key={block.id} block={block} />;
  if (block.type === 'step-by-step') return <StepByStepBlock key={block.id} block={block} />;
  return null;
};
