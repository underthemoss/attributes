import React from 'react';
import {
  DocumentIcon,
  PuzzlePieceIcon,
  TagIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const items = [
  { label: 'Documents', icon: DocumentIcon, view: 'documents' },
  { label: 'Parsed', icon: PuzzlePieceIcon, view: 'parsed' },
  { label: 'Attributes', icon: TagIcon, view: 'attributes' },
  { label: 'Products', icon: CubeIcon, view: 'products' },
];

export default function Sidebar({ currentView, setView }: { currentView: string; setView: (view: string) => void }) {
  return (
    <aside className="bg-sidebar flex flex-col py-6 px-2 w-56 min-h-screen border-r border-border transition-all duration-200 sm:w-56 sm:items-start w-16 items-center">
      <nav className="flex flex-col gap-1 w-full">
        {items.map(item => {
          const Icon = item.icon;
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              className={`group flex items-center gap-3 px-4 py-2 rounded-none font-medium transition-colors text-left w-full border-l-4 ${active ? 'border-accent bg-gray-50 text-text' : 'border-transparent text-subtext'} hover:bg-gray-100 focus:outline-none`}
              aria-current={active ? 'page' : undefined}
              onClick={() => setView(item.view)}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-base sm:inline hidden group-hover:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
