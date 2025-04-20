# Database Schema

See `supabase/migrations/001_initial_schema.sql` for full DDL.  
Key tables:  
- attribute_definitions  
- attribute_groups  
- attribute_templates  
- products  
- product_attribute_values  
- product_metadata  
- search_vector on products for FTS  
- pg_trgm extension for name trigram

---

## Documents Table

The `documents` table tracks all uploaded documents and their ingestion status. It is the entry point for the document processing pipeline.

**Schema:**
```sql
create table documents (
  id             uuid      primary key default gen_random_uuid(),
  path           text      not null, -- Supabase Storage path
  status         text      not null default 'pending',
  uploaded_at    timestamptz default now(),
  processed_at   timestamptz,
  error_message  text
);
```

**Status transitions:**
- `pending` → Document has been uploaded and is awaiting processing
- `extracted` → Document has been parsed by the ingestion worker, and raw attributes extracted
- `completed` → Post-processing and assembly are finished (future pipeline stages)
- `error` → Processing failed; see `error_message`

**Indexes:**
- `status` (for efficient queueing of pending docs)
- `uploaded_at` (for time-based queries)

**Storage:**
- Files are stored in the Supabase Storage bucket `documents`, with the `path` column referencing the storage object path.

**Pipeline:**
- New uploads are inserted with `status = 'pending'`
- The ingestion worker fetches pending docs, processes them, and updates status
- Downstream workers can further update status as the pipeline progresses
