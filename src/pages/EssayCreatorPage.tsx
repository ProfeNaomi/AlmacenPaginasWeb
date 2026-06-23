import React from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import TopNav from '../components/EssayCreator/TopNav';
import LeftPanel from '../components/EssayCreator/LeftPanel';
import RightPanel from '../components/EssayCreator/RightPanel';

export default function EssayCreatorPage() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-900 text-slate-100">
      <TopNav />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={30} minSize={20} className="bg-slate-800 flex flex-col border-r border-slate-700">
            <LeftPanel />
          </Panel>
          <PanelResizeHandle className="w-2 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize" />
          <Panel defaultSize={70} minSize={30} className="bg-slate-900 flex flex-col">
            <RightPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
