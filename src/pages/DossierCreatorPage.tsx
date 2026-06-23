import React from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import TopNavDossier from '../components/DossierCreator/TopNavDossier';
import LeftSidebar from '../components/DossierCreator/LeftSidebar';
import Canvas from '../components/DossierCreator/Canvas';
import RightInspector from '../components/DossierCreator/RightInspector';

export default function DossierCreatorPage() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-900 text-slate-100">
      <TopNavDossier />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Columna Izquierda: Biblioteca de Activos */}
          <Panel defaultSize={25} minSize={15} className="bg-slate-800 flex flex-col border-r border-slate-700">
            <LeftSidebar />
          </Panel>
          
          <PanelResizeHandle className="w-2 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize" />
          
          {/* Columna Central: Lienzo */}
          <Panel defaultSize={50} minSize={30} className="bg-slate-900 flex flex-col">
            <Canvas />
          </Panel>
          
          <PanelResizeHandle className="w-2 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize" />
          
          {/* Columna Derecha: Inspector Contextual */}
          <Panel defaultSize={25} minSize={15} className="bg-slate-800 flex flex-col border-l border-slate-700">
            <RightInspector />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
