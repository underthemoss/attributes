/// <reference types="vite/client" />
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const UploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: uploadError } = await supabase.storage.from('documents').upload(file.name, file);
      if (uploadError || !data) throw uploadError || new Error('Upload failed');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: data.path }),
      });
      if (!res.ok) throw new Error('Failed to notify backend');
      setSuccess('File uploaded and backend notified!');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <label className="block mb-2 font-bold">Upload a document:</label>
      <input
        type="file"
        className="mb-4"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleUpload}
        disabled={loading || !file}
      >
        {loading ? 'Uploading...' : 'Upload & Parse'}
      </button>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {success && <div className="mt-2 text-green-600">{success}</div>}
    </div>
  );
};

// Design Note:
// This component provides a simple document upload UI using React, TypeScript, and Tailwind. It uploads the selected file to the Supabase Storage 'documents' bucket, then notifies the backend via a POST to /api/upload with the file path. Loading and error states are handled for user feedback, and all logic is encapsulated in a single, reusable component.
