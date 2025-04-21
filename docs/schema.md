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

**Actual Schema (Live Database):**
```sql
create table documents (
  id             uuid primary key default gen_random_uuid(),
  storage_path   text not null, -- Supabase Storage path
  status         text default 'pending',
  uploaded_at    timestamptz default now(),
  processed_at   timestamptz,
  error_message  text
);
```

| Column         | Type                     | Nullable | Default           | Description                      |
|---------------|--------------------------|----------|-------------------|----------------------------------|
| id            | uuid                     | NO       | gen_random_uuid() | Unique document identifier       |
| storage_path  | text                     | NO       |                   | Path in Supabase Storage bucket  |
| status        | text                     | YES      | 'pending'         | Ingestion status                 |
| uploaded_at   | timestamptz with time zone| YES     | now()             | Upload timestamp                 |
| processed_at  | timestamptz with time zone| YES     |                   | When ingestion completed         |
| error_message | text                     | YES      |                   | Error details if failed          |

**Status transitions:**
- `pending` → Document has been uploaded and is awaiting processing
- `extracted` → Document has been parsed by the ingestion worker, and raw attributes extracted
- `completed` → Post-processing and assembly are finished (future pipeline stages)
- `error` → Processing failed; see `error_message`

**Indexes:**
- `status` (for efficient queueing of pending docs)
- `uploaded_at` (for time-based queries)

**Storage:**
- Files are stored in the Supabase Storage bucket `documents`, with the `storage_path` column referencing the storage object path.

**Pipeline:**
- New uploads are inserted with `status = 'pending'`
- The ingestion worker fetches pending docs, processes them, and updates status
- Downstream workers can further update status as the pipeline progresses
