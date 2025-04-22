import React, { useEffect, useState } from 'react';
import { supabase } from '../shared/supabaseClient';
import { UploadForm } from '../components/UploadForm';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genId, setGenId] = useState<string | null>(null);

  const statusColorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    extracted: 'bg-blue-100 text-blue-800',
    generating: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  const fetchDocuments = async () => {
    console.log('[fetchDocuments] Starting document fetch process (storage + table merge)');
    setLoading(true);
    setError(null);
    try {
      // Fetch files from storage
      console.log('[fetchDocuments] Fetching files from Supabase storage...');
      const { data: files, error: listError } = await supabase.storage.from('documents').list('', { limit: 1000 });
      if (listError) {
        console.error('[fetchDocuments] Error fetching from storage:', listError);
        setError(listError.message);
        setLoading(false);
        return;
      }
      console.log('[fetchDocuments] Storage fetch result:', files);

      // Fetch parsed_attributes table rows
      console.log('[fetchDocuments] Fetching parsed_attributes rows...');
      const { data: parsedRows, error: parsedError } = await supabase
        .from('parsed_attributes')
        .select('id, file_name, parsed_at');
      if (parsedError) {
        console.error('[fetchDocuments] Error fetching from parsed_attributes:', parsedError);
        setError(parsedError.message);
        setLoading(false);
        return;
      }
      console.log('[fetchDocuments] parsed_attributes fetch result:', parsedRows);

      // Merge: For each file, check if it has a parsed_attributes row (by file_name)
      const enriched = (files || []).map(file => {
        // Find all matching parsed rows for this file
        const matchingRows = (parsedRows || []).filter(row => row.file_name === file.name);
        // Sort by parsed_at (desc)
        matchingRows.sort((a, b) => {
          const aTime = a.parsed_at ? new Date(a.parsed_at).getTime() : 0;
          const bTime = b.parsed_at ? new Date(b.parsed_at).getTime() : 0;
          return bTime - aTime;
        });
        const parsedRow = matchingRows[0] || null;
        if (parsedRow) {
          console.log(`[fetchDocuments] For file ${file.name}, using parsedRow:`, parsedRow);
        }
        return {
          ...file,
          isParsed: !!parsedRow,
          lastParsedAt: parsedRow ? parsedRow.parsed_at : null,
        };
      });
      console.log('[fetchDocuments] Enriched merged documents:', enriched);
      setDocuments(enriched);
    } catch (err: any) {
      console.error('[fetchDocuments] Caught error:', err);
      setError(err.message || 'Error fetching documents');
    } finally {
      setLoading(false);
      console.log('[fetchDocuments] Done.');
    }
  };



  const parseDocument = async (docId: string) => {
    await fetch(`/api/parse/${docId}`, { method: 'POST' });
    await fetchDocuments();
  };

  const generateProducts = async (docId: string) => {
    setGenId(docId);
    await fetch(`/api/generate/${docId}`, { method: 'POST' });
    setGenId(null);
    await fetchDocuments();
  };

  useEffect(() => { fetchDocuments(); }, []);

  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text">Documents</h2>
        <button className="px-4 py-2 bg-accent text-white rounded-md font-medium shadow-sm hover:bg-opacity-90 transition" onClick={fetchDocuments} disabled={loading}>
          Refresh
        </button>
      </div>
      <div className="mb-8">
        <UploadForm onSuccess={fetchDocuments} />
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
                <th className="py-3 px-4 text-left font-medium text-subtext">Status</th>
                <th className="py-3 px-4 text-left font-medium text-subtext">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((file: any) => {
                  const isParsed = !!file.isParsed;
                  return (
                    <tr key={file.id || file.name} className="border-b border-border last:border-0 hover:bg-gray-50 transition">
                      <td className="py-2 px-4 font-mono text-xs text-text">{file.name}</td>
                      <td className="py-2 px-4 text-text">{file.size ?? '-'}</td>
                      <td className="py-2 px-4 text-text">{file.updated_at ? new Date(file.updated_at).toLocaleString() : '-'}</td>
                      <td className="py-2 px-4 text-text">
                        {isParsed ? (
                          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">Parsed</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Not Parsed</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-text">
                        {/* Actions: show Parse button if not parsed */}
                        {!isParsed && (
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            onClick={async () => {
                              console.log('[Documents] Parse button clicked for file:', file.name);
                              await parseDocument(file.name);
                            }}
                          >
                            Parse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
