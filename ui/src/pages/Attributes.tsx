import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function Attributes() {
  const [groups, setGroups] = useState<any[]>([]);
  const [defs, setDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('attribute_groups').select('*'),
      supabase.from('attribute_definitions').select('*'),
    ]).then(([groupsRes, defsRes]) => {
      if (groupsRes.error) setError(groupsRes.error.message);
      if (defsRes.error) setError(defsRes.error.message);
      setGroups(groupsRes.data || []);
      setDefs(defsRes.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="font-sans">
      <h2 className="text-xl font-bold mb-4">Attribute Definitions</h2>
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <details key={group.id} className="bg-white rounded-lg shadow-sm">
              <summary className="px-4 py-2 cursor-pointer font-semibold bg-secondary/10">
                {group.display_name}
              </summary>
              <ul className="p-4">
                {defs.filter(def => def.group_id === group.id).map(def => (
                  <li key={def.id} className="mb-2">
                    <span className="font-semibold">{def.display_name}</span>
                    {def.unit ? <span className="text-xs text-gray-500 ml-2">({def.unit})</span> : null}
                    <div className="text-gray-500 text-xs">{def.description}</div>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
