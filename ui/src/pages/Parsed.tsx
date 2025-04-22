import React, { useEffect, useState } from 'react';
import { supabase } from '../shared/supabaseClient';

export default function Parsed() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase
      .from('parsed_attributes')
      .select('id, file_name, bucket, parsed_json, parsed_at')
      .order('parsed_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setGroups(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="font-sans">
      <h2 className="text-xl font-bold mb-4">Parsed Attributes</h2>
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          {groups.map((item: any, i) => (
            <details key={item.id || i} className="bg-white rounded-lg shadow-sm">
              <summary className="px-4 py-2 cursor-pointer font-semibold bg-secondary/10">
                File: {item.file_name} <span className="ml-2 text-xs text-gray-500">({item.parsed_at && new Date(item.parsed_at).toLocaleString()})</span>
              </summary>
              <div className="p-4">
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap max-w-full">
                  {typeof item.parsed_json === 'string' ? item.parsed_json : JSON.stringify(item.parsed_json, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
