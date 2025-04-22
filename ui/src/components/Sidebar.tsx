import React, { useEffect, useState } from 'react';
import { supabase } from '../shared/supabaseClient';
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
  const [counts, setCounts] = useState<{ [status: string]: number }>({});

  const fetchStatusCounts = async () => {
    const statuses = ['pending', 'extracted', 'completed', 'error'];
    const newCounts: { [status: string]: number } = {};
    try {
      await Promise.all(statuses.map(async status => {
        const { count, error } = await supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', status);
        if (!error) {
          newCounts[status] = count || 0;
        } else {
          newCounts[status] = 0;
        }
      }));
      setCounts(newCounts);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchStatusCounts();
    const chan = supabase
      .channel('doc-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchStatusCounts())
      .subscribe();
    return () => { supabase.removeChannel(chan); };
  }, []);

  return (
    <aside className="bg-sidebar flex flex-col py-6 px-2 w-56 min-h-screen border-r border-border transition-all duration-200 sm:w-56 sm:items-start w-16 items-center">
      <nav className="flex flex-col gap-1 w-full">
        {/* Sidebar status counts logging */}
        {Object.keys(counts).length === 0 && (
          <div className="text-xs text-gray-400 px-4">No status counts loaded</div>
        )}
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
              {item.view === 'documents' && (
                <span className="ml-2 flex gap-1">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-gray-200 text-xs text-gray-700" title="Pending">{counts['pending'] || 0}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-yellow-100 text-xs text-yellow-700" title="Extracted">{counts['extracted'] || 0}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-xs text-green-700" title="Completed">{counts['completed'] || 0}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-xs text-red-700" title="Error">{counts['error'] || 0}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
