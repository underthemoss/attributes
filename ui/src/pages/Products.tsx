import React, { useEffect, useState } from 'react';
import { supabase } from '../shared/supabaseClient';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any | null>(null);

  useEffect(() => {
  setLoading(true);
  setError(null);
  supabase
    .from('products')
    .select('id, name, attributes_json, product_metadata')
    .then(({ data, error }) => {
      if (error) setError(error.message);
      setProducts(data || []);
      setLoading(false);
    });
}, []);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.model?.toLowerCase().includes(search.toLowerCase()) ||
    p.manufacturer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Products</h2>
        <input
          className="px-2 py-1 border rounded"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm">
          <thead>
            <tr className="bg-secondary/10">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Manufacturer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(prod => (
              <tr
                key={prod.id}
                className="border-b last:border-0 cursor-pointer hover:bg-accent/10"
                onClick={() => setModal(prod)}
              >
                <td className="p-2">{prod.name}</td>
                <td className="p-2">{prod.model}</td>
                <td className="p-2">{prod.manufacturer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
      <button className="absolute top-2 right-2 text-xl" onClick={() => setModal(null)}>&times;</button>
      <h3 className="text-lg font-bold mb-2">{modal.name}</h3>
      <div className="mb-2 text-gray-500">
        {modal.product_metadata?.manufacturer || modal.product_metadata?.model
          ? <>Manufacturer: {modal.product_metadata?.manufacturer || '-'} | Model: {modal.product_metadata?.model || '-'}</>
          : <span>No metadata</span>}
      </div>
      <div className="mb-2 font-semibold">Specs:</div>
      <table className="w-full text-xs bg-gray-50 rounded mb-2">
        <thead>
          <tr>
            <th className="text-left p-1">Attribute</th>
            <th className="text-left p-1">Value</th>
            <th className="text-left p-1">Unit</th>
          </tr>
        </thead>
        <tbody>
          {modal.attributes_json && Object.entries(modal.attributes_json).map(([key, val]: [string, any]) => (
            <tr key={key}>
              <td className="font-mono text-gray-600 p-1">{key}</td>
              <td className="p-1">{typeof val === 'object' ? val.value : val}</td>
              <td className="p-1">{typeof val === 'object' && val.unit ? val.unit : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mb-2 font-semibold">Metadata:</div>
      <pre className="bg-gray-100 rounded p-2 text-xs mb-2 overflow-x-auto">{JSON.stringify(modal.product_metadata, null, 2)}</pre>
    </div>
  </div>
)}
    </div>
  );
}
