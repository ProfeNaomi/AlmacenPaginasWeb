import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDossierById, getDossierTemplateById, Dossier, DossierTemplate } from '../lib/dossiers';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { DossierRenderer } from '../components/ui/DossierRenderer';

export default function DossierViewer() {
  const { dossierId } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [template, setTemplate] = useState<DossierTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDossier = async () => {
      if (!dossierId) return;
      setLoading(true);
      const d = await getDossierById(dossierId);
      if (d) {
        setDossier(d);
        if (d.templateId) {
          const t = await getDossierTemplateById(d.templateId);
          setTemplate(t);
        }
      }
      setLoading(false);
    };
    loadDossier();
  }, [dossierId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;
  if (!dossier) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Dossier no encontrado</div>;

  return (
    <div className="bg-slate-200 print:bg-white min-h-screen font-sans">
      <style>{`
        @media print {
          body { background-color: white !important; }
          .break-after-page { page-break-after: always; }
          .break-inside-avoid { page-break-inside: avoid; }
          @page { margin: 0; }
        }
      `}</style>

      {/* Top Bar (Hidden in Print) */}
      <div className="fixed top-0 left-0 w-full bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-50 print:hidden shadow-lg">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all"
        >
          <Printer className="w-5 h-5" /> Imprimir / PDF
        </button>
      </div>

      {/* Content */}
      <div className="pt-24 print:pt-0 pb-12 print:pb-0">
        {dossier.pages.map((page, idx) => {
          const paddingClass = dossier.pageMargins === 'narrow' ? 'p-[12mm]' : dossier.pageMargins === 'wide' ? 'p-[40mm]' : 'p-[25mm]';
          return (
            <div 
              key={page.id} 
              className={`max-w-[210mm] min-h-[297mm] mx-auto bg-white mb-8 print:mb-0 shadow-2xl print:shadow-none break-after-page relative flex flex-col box-border ${paddingClass}`}
              style={{ margin: '0 auto', marginBottom: '2rem' }}
            >
              {/* Header Template */}
              {idx === 0 && (dossier.headerContent || template?.headerContent) && (
                <div 
                  className="mb-8 w-full text-black prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: dossier.headerContent || template?.headerContent || '' }} 
                />
              )}

              {/* Page Blocks */}
              <div className="flex-1 w-full">
                {(page.blocks || []).map(b => <DossierRenderer key={b.id} block={b} />)}
              </div>

              {/* Footer Template */}
              {idx === dossier.pages.length - 1 && dossier.showFooter !== false && (dossier.footerContent || template?.footerContent) && (
                <div 
                  className="mt-auto pt-4 w-full text-black border-t border-gray-300 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: dossier.footerContent || template?.footerContent || '' }} 
                />
              )}

              {/* Page Numbering */}
              {dossier.pageNumbers && dossier.pageNumbers !== 'none' && (
                <div className={`absolute text-sm font-bold text-slate-800 z-50 print:text-black
                  ${dossier.pageNumbers.includes('top') ? 'top-[15mm]' : 'bottom-[15mm]'}
                  ${dossier.pageNumbers.includes('left') ? 'left-[20mm]' : dossier.pageNumbers.includes('right') ? 'right-[20mm]' : 'left-1/2 -translate-x-1/2'}
                `}>
                  {idx + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
