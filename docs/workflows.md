# Workflows

1. **UploadDocumentCommand**  
   - Upload file to Supabase Storage (`documents` bucket) via UI
   - POST to `/api/upload` with `{ storage_path }`
   - Backend inserts row in `documents` table with `status='pending'` and `storage_path`
   - Emit `DocumentUploaded` event with document ID

2. **Document Ingestion Worker**  
   - On DocumentUploaded  
   - Call GPT‑API with library JSON  
   - Emit ProductExtracted  

3. **Product Query API**  
   - Expose Faceted Search  
   - Query Postgres FTS + numeric filters
