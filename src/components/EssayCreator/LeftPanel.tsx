import React, { useState } from 'react';
import { FileText, Link, AlignLeft } from 'lucide-react';

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<'fuentes' | 'notas' | 'esquema'>('fuentes');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-700 p-2 space-x-2 shrink-0">
        <TabButton active={activeTab === 'fuentes'} onClick={() => setActiveTab('fuentes')} icon={<Link className="w-4 h-4"/>} label="Fuentes" />
        <TabButton active={activeTab === 'notas'} onClick={() => setActiveTab('notas')} icon={<FileText className="w-4 h-4"/>} label="Notas" />
        <TabButton active={activeTab === 'esquema'} onClick={() => setActiveTab('esquema')} icon={<AlignLeft className="w-4 h-4"/>} label="Esquema" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'fuentes' && (
          <div className="text-slate-400 text-sm">
            <p>Arrastra fuentes aquí o añade nuevas para comenzar.</p>
            {/* Example Card */}
            <div className="mt-4 p-3 bg-slate-700/50 rounded-xl border border-slate-600 cursor-grab active:cursor-grabbing hover:border-slate-500 transition-colors shadow-md">
              <h4 className="text-slate-200 font-medium mb-1">Referencia APA 1</h4>
              <p className="text-xs text-slate-400">Smith, J. (2025). The future of UX.</p>
            </div>
          </div>
        )}
        {activeTab === 'notas' && (
          <div className="text-slate-400 text-sm">
            <p>Tus notas irán aquí.</p>
          </div>
        )}
        {activeTab === 'esquema' && (
          <div className="text-slate-400 text-sm">
            <p>Esquema del documento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center space-x-2 py-1.5 px-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
