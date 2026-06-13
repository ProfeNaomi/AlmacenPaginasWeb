import React from 'react';
import { Block } from '../../lib/courses';
import { CustomAppRenderer } from '../apps/AppRegistry';

export const DossierRenderer: React.FC<{ block: Block }> = ({ block }) => {
  if (block.type === 'row') {
    return (
      <div key={block.id} className="flex flex-row w-full gap-4 my-4 break-inside-avoid">
        {block.columns?.map(col => (
          <div key={col.id} className="flex-1 space-y-4">
            {(col.blocks || []).map(subBlock => (
              <DossierRenderer key={subBlock.id} block={subBlock as Block} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'box') {
    const themes = {
      history: 'border-[#784d2f] text-black',
      situation: 'border-[#1b7330] text-black',
      formula: 'border-purple-700 text-black',
      exercise: 'border-teal-800 text-black',
      warning: 'border-red-700 text-black',
      theorem: 'border-cyan-700 text-black',
      alert: 'border-orange-600 text-black'
    };
    const theme = themes[block.theme as keyof typeof themes || 'history'];
    return (
      <div key={block.id} className={`my-4 rounded-xl overflow-hidden border-2 ${theme} break-inside-avoid shadow-none`}>
        {block.title && (
          <div className={`px-4 py-2 font-display font-bold text-lg border-b-2 ${theme} bg-gray-100 print:bg-gray-100 print:!bg-gray-100`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            {block.title}
          </div>
        )}
        <div 
          className={`p-4 prose max-w-none prose-slate text-black prose-headings:font-display prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl`}
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div 
        key={block.id} 
        className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl text-black my-3"
        dangerouslySetInnerHTML={{ __html: block.content || '' }}
      />
    );
  }

  if (block.type === 'image') {
    return (
      <div key={block.id} className="relative mx-auto my-4 w-full break-inside-avoid">
        <img 
          src={block.url} 
          alt="" 
          className="w-full max-w-3xl mx-auto border border-gray-300 rounded" 
        />
      </div>
    );
  }

  if (block.type === 'video') {
    return (
      <div key={block.id} className="my-4 border-2 border-dashed border-gray-400 p-4 text-center rounded break-inside-avoid">
        <p className="font-bold text-gray-600">🎥 [Video: {block.url}]</p>
        {block.caption && <p className="italic mt-2">{block.caption}</p>}
      </div>
    );
  }

  if (block.type === 'app') {
    return (
      <div key={block.id} className="my-4 border-2 border-dashed border-gray-400 p-4 text-center rounded break-inside-avoid">
        <p className="font-bold text-gray-600">📱 [Simulador App: {block.url}]</p>
      </div>
    );
  }

  // Interactive blocks ignored in dossier print mode
  return null;
};
