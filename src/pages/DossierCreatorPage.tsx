import React from 'react';
import TopNavDossier from '../components/DossierCreator/TopNavDossier';
import LeftSidebar from '../components/DossierCreator/LeftSidebar';
import Canvas from '../components/DossierCreator/Canvas';
import RightInspector from '../components/DossierCreator/RightInspector';

export default function DossierCreatorPage() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-900 text-slate-100">
      <TopNavDossier />
      <div className="flex-1 overflow-hidden flex flex-row">
        <div className="w-1/4 bg-slate-800 flex flex-col border-r border-slate-700">
          <LeftSidebar />
        </div>
        <div className="w-1/2 bg-slate-900 flex flex-col">
          <Canvas />
        </div>
        <div className="w-1/4 bg-slate-800 flex flex-col border-l border-slate-700">
          <RightInspector />
        </div>
      </div>
    </div>
  );
}
