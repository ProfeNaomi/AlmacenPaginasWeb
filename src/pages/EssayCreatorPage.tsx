import React from 'react';
import TopNav from '../components/EssayCreator/TopNav';
import LeftPanel from '../components/EssayCreator/LeftPanel';
import RightPanel from '../components/EssayCreator/RightPanel';

export default function EssayCreatorPage() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-900 text-slate-100">
      <TopNav />
      <div className="flex-1 overflow-hidden flex flex-row">
        <div className="w-1/3 bg-slate-800 flex flex-col border-r border-slate-700">
          <LeftPanel />
        </div>
        <div className="flex-1 bg-slate-900 flex flex-col">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
