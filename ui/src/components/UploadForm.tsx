/// <reference types="vite/client" />
import React, { useState } from 'react';
import { supabase } from '../shared/supabaseClient';

export const UploadForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setError(null);
    setSuccess(null);
    console.log('[UploadForm] File selected:', selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file.');
      console.error('[UploadForm] No file selected');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    console.log('[UploadForm] Upload started');
    console.log('[UploadForm] File:', file);
  
    try {
      console.log('[UploadForm] Calling supabase.storage.from("documents").upload with:', file.name);
      const { data, error: uploadError } = await supabase.storage.from('documents').upload(file.name, file);
      console.log('[UploadForm] Supabase upload result:', { data, uploadError });
      if (uploadError || !data) {
        console.error('[UploadForm] Upload error:', uploadError);
        throw uploadError || new Error('Upload failed');
      }
      console.log('[UploadForm] Notifying backend at /api/upload with:', data.path);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: data.path }),
      });
      console.log('[UploadForm] Backend response:', res.status, res.statusText);
      if (!res.ok) throw new Error('Failed to notify backend');
      setSuccess('File uploaded and backend notified!');
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('[UploadForm] Caught error:', err);
    } finally {
      setLoading(false);
      console.log('[UploadForm] Upload finished');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-border shadow-sm max-w-lg flex flex-col gap-4">
      <label className="block font-medium text-text mb-1">Upload a document</label>
      <input
        type="file"
        className="block w-full text-subtext file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-text disabled:opacity-50"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button
        className="mt-2 px-5 py-2 bg-accent text-white rounded-md font-semibold shadow-sm hover:bg-opacity-90 transition disabled:opacity-60"
        onClick={handleUpload}
        disabled={loading || !file}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {/* For debugging: show supabaseUrl and file info if error */}
      {error && (
        <div className="text-xs text-gray-400 break-all mt-1">
          <div><b>File Name:</b> {file?.name}</div>
          <div><b>File Type:</b> {file?.type}</div>
          <div><b>File Size:</b> {file?.size}</div>
        </div>
      )}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </div>
  );
};

// Design Note:
// This component provides a simple document upload UI using React, TypeScript, and Tailwind. It uploads the selected file to the Supabase Storage 'documents' bucket, then notifies the backend via a POST to /api/upload with the file path. Loading and error states are handled for user feedback, and all logic is encapsulated in a single, reusable component.
