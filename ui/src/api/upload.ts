// ui/src/api/upload.ts
// API route to proxy upload requests from the frontend to the backend service

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Backend URL: update this to your actual backend host/port
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api/upload';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    // Forward the request body to the backend
    const backendRes = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Proxy error' });
  }
}
