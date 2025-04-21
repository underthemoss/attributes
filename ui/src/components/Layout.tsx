import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, currentView, setView }: {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}) {
  return (
    <div className="flex h-screen font-sans bg-sidebar text-text">
      <div className="sticky top-0 h-screen z-10"><Sidebar currentView={currentView} setView={setView} /></div>
      <main className="flex-1 overflow-y-auto p-8 bg-sidebar border-l border-border focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
