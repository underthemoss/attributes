# Workflows

1. **UploadDocumentCommand**  
   - Persist file in Supabase Storage  
   - Emit DocumentUploaded event

2. **Document Ingestion Worker**  
   - On DocumentUploaded  
   - Call GPT‑API with library JSON  
   - Emit ProductExtracted  

3. **Product Query API**  
   - Expose Faceted Search  
   - Query Postgres FTS + numeric filters
