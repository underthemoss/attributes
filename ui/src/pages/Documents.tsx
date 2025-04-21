import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UploadForm } from '../components/UploadForm';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function Documents() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsingIdx, setParsingIdx] = useState<number | null>(null);
  const [parseResults, setParseResults] = useState<{ [idx: number]: string }>({});
  const [parseErrors, setParseErrors] = useState<{ [idx: number]: string }>({});

  const handleParse = async (doc: any, idx: number) => {
    setParsingIdx(idx);
    setParseResults(r => ({ ...r, [idx]: '' }));
    setParseErrors(e => ({ ...e, [idx]: '' }));
    try {
      const parseUrl = import.meta.env.VITE_BACKEND_API_PARSE_URL;
      if (!parseUrl) throw new Error('VITE_BACKEND_API_PARSE_URL is not set in .env');
      const res = await fetch(parseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'documents', name: doc.name }),
      });
      if (!res.ok) throw new Error('Failed to parse document');
      const data = await res.json();
      console.log('Parse API response:', data);
      setParseResults(r => ({ ...r, [idx]: data.result || JSON.stringify(data) }));
    } catch (err: any) {
      console.error('Parse API error:', err);
      setParseErrors(e => ({ ...e, [idx]: err.message || 'Parse error' }));
    } finally {
      setParsingIdx(null);
    }
  };


  // Fetch all files in the 'documents' bucket via Supabase Storage API
  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use Supabase Storage list API
      const { data, error } = await supabase.storage.from('documents').list('', { limit: 100 });
      if (error) throw error;
      setDocs(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text">Documents</h2>
        <button className="px-4 py-2 bg-accent text-white rounded-md font-medium shadow-sm hover:bg-opacity-90 transition" onClick={fetchDocs} disabled={loading}>
          Refresh
        </button>
      </div>
      <div className="mb-8">
        <UploadForm onSuccess={fetchDocs} />
      </div>
      {loading ? (
        <div className="animate-pulse text-subtext">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-border text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="py-3 px-4 text-left font-medium text-subtext">File Name</th>
                <th className="py-3 px-4 text-left font-medium text-subtext">Size (bytes)</th>
                <th className="py-3 px-4 text-left font-medium text-subtext">Last Modified</th>
                <th className="py-3 px-4 text-left font-medium text-subtext">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc: any, idx: number) => (
                <tr key={doc.id || doc.name} className="border-b border-border last:border-0 hover:bg-gray-50 transition">
                  <td className="py-2 px-4 font-mono text-xs text-text">{doc.name}</td>
                  <td className="py-2 px-4 text-text">{doc.metadata?.size ?? '-'}</td>
                  <td className="py-2 px-4 text-text">{doc.metadata?.lastModified ? new Date(doc.metadata.lastModified).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-text">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      disabled={parsingIdx === idx}
                      onClick={() => handleParse(doc, idx)}
                    >
                      {parsingIdx === idx ? 'Parsing...' : 'Parse'}
                    </button>
                    {parseErrors[idx] ? (
                      <span className="text-red-700 text-xs">Error: {parseErrors[idx]}</span>
                    ) : parseResults[idx] === '' ? (
                      <span className="text-yellow-700 text-xs">No result returned.</span>
                    ) : parseResults[idx] && (
                      <span className="text-green-700 text-xs">{JSON.stringify(parseResults[idx])}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
