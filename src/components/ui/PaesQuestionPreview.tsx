import React from 'react';
import { Question } from '../../lib/paes';

export const PaesQuestionPreview = ({ question, index }: { question: Question, index?: number }) => {
  return (
    <div className="bg-white text-black p-6 sm:p-8 rounded-none border border-slate-300 shadow-sm relative font-sans max-w-3xl mx-auto my-4 overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Top PAES styling line - optional decoration to make it look like a booklet */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>

      <div className="flex gap-4">
        {/* Question Number */}
        {index !== undefined && (
          <div className="text-xl font-bold pt-1 shrink-0">
            {index}.
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Main Question Text (Rich Text) */}
          {/* We use prose but force text-black, remove dark mode overrides */}
          <div 
            className="prose prose-slate prose-img:mx-auto prose-img:max-w-full prose-p:leading-relaxed prose-p:my-2 prose-a:text-blue-600 prose-strong:font-bold text-[15px]"
            dangerouslySetInnerHTML={{ __html: question.text }}
          />

          {/* Legacy single Image (if not using inline images) */}
          {question.imageUrl && (
            <div className="my-6 flex justify-center">
              <img src={question.imageUrl} alt="Imagen de apoyo" className="max-w-full max-h-64 object-contain" />
            </div>
          )}

          {/* Options */}
          <div className="mt-8 space-y-3">
            {question.options.map((opt, i) => (
              <div key={i} className="flex gap-3 text-[15px]">
                <span className="font-bold shrink-0 w-6">{String.fromCharCode(65 + i)})</span>
                <div className="flex-1" dangerouslySetInnerHTML={{ __html: opt }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaesQuestionPreview;
