import React, { useEffect, useState } from 'react';
import { supabase } from '../shared/supabaseClient';

export default function Attributes() {
  const [view, setView] = useState<'library' | 'mapped'>('library');
  const [groups, setGroups] = useState<any[]>([]);
  const [defs, setDefs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  setLoading(true);
  setError(null);
  Promise.all([
    supabase.from('attribute_groups').select('id,name'),
    supabase.from('attribute_definitions').select('id,display_name,unit,concept_ids')
  ]).then(([groupsRes, defsRes]) => {
    if (groupsRes.error) {
      setError(groupsRes.error.message);
      setLoading(false);
      return;
    }
    if (defsRes.error) {
      setError(defsRes.error.message);
      setLoading(false);
      return;
    }
    const groups = groupsRes.data || [];
    const defs = defsRes.data || [];
    const library = groups.map((g: any) => ({
      ...g,
      defs: defs.filter((d: any) => (d.concept_ids || []).includes(g.id))
    }));
    setGroups(library);
    setLoading(false);
  });
}, []);

  const mappedProduct = products.find((p: any) => p.id === selectedProductId);
  const mappedAttrs = mappedProduct?.attributes_json || {};

  return (
    <div className="font-sans">
      <h2 className="text-xl font-bold mb-4">Attributes</h2>
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded ${view === 'library' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setView('library')}
        >
          Library
        </button>
        <button
          className={`px-3 py-1 rounded ${view === 'mapped' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setView('mapped')}
        >
          Mapped
        </button>
      </div>
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : view === 'library' ? (
        <div className="space-y-4">
          {groups.map((group: any) => (
  <details key={group.id} className="bg-white rounded-lg shadow-sm">
    <summary className="px-4 py-2 cursor-pointer font-semibold bg-secondary/10">
      {group.name}
    </summary>
    <ul className="p-4">
      {group.defs.map((def: any) => (
        <li key={def.id} className="mb-2">
          <span className="font-semibold">{def.display_name}</span>
          {def.unit ? <span className="text-xs text-gray-500 ml-2">({def.unit})</span> : null}
        </li>
      ))}
    </ul>
  </details>
))}
        </div>
      ) : (
        <div>
          <div className="mb-2">
            <label className="font-medium mr-2">Select Product:</label>
            <select
              className="border rounded px-2 py-1"
              value={selectedProductId || ''}
              onChange={e => setSelectedProductId(e.target.value)}
            >
              <option value="">-- Choose a product --</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
          </div>
          {selectedProductId && mappedProduct ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mt-2">
              <h3 className="font-semibold mb-2">Mapped Attributes</h3>
              <ul>
                {Object.entries(mappedAttrs).map(([key, val]: [string, any]) => (
                  <li key={key} className="mb-1">
                    <span className="font-mono text-xs text-gray-500">{key}</span>: {val && typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-400 mt-4">Select a product to view mapped attributes.</div>
          )}
        </div>
      )}
    </div>
  );
}

