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

---

## Attribute Definitions

The `attribute_definitions` table defines the root set of attributes available for mapping and assembly. Each attribute can reference one or more concept groups via `concept_ids`.

**Schema:**
```sql
create table attribute_definitions (
  id             uuid primary key default gen_random_uuid(),
  internal_name  text not null unique,
  display_name   text not null,
  description    text,
  data_type      text,
  unit           text,
  synonyms       text[],
  concept_ids    uuid[]
);
```

| Column         | Type    | Nullable | Description                                      |
|----------------|---------|----------|--------------------------------------------------|
| id             | uuid    | NO       | Unique attribute identifier                      |
| internal_name  | text    | NO       | Canonical name for code mapping                  |
| display_name   | text    | NO       | Human-readable label                             |
| description    | text    | YES      | Attribute description                            |
| data_type      | text    | YES      | Data type (e.g., float, int, string)             |
| unit           | text    | YES      | SI or customary unit (e.g., m, kg, Pa)           |
| synonyms       | text[]  | YES      | Alternate names for mapping                      |
| concept_ids    | uuid[]  | YES      | References to attribute_groups                   |

---

## Attribute Groups

The `attribute_groups` table defines logical groupings of attributes ("concepts").

**Schema:**
```sql
create table attribute_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  description text
);
```

| Column      | Type | Nullable | Description                          |
|-------------|------|----------|--------------------------------------|
| id          | uuid | NO       | Unique group identifier              |
| name        | text | NO       | Name of the concept group            |
| description | text | YES      | Description of the group             |

---

## Group Attributes

The `group_attributes` table links attribute definitions to groups (many-to-many).

**Schema:**
```sql
create table group_attributes (
  group_id      uuid references attribute_groups(id),
  attribute_id  uuid references attribute_definitions(id),
  primary key (group_id, attribute_id)
);
```

| Column       | Type | Nullable | Description                          |
|--------------|------|----------|--------------------------------------|
| group_id     | uuid | NO       | Reference to attribute_groups.id      |
| attribute_id | uuid | NO       | Reference to attribute_definitions.id |

---

## Products Table: attributes_json

The `products` table now includes an `attributes_json` column for storing assembled product attributes as JSON.

**Schema Addition:**
```sql
alter table products add column attributes_json jsonb default '{}'::jsonb;
```

| Column          | Type  | Nullable | Default   | Description                          |
|-----------------|-------|----------|-----------|--------------------------------------|
| attributes_json | jsonb | YES      | '{}'::jsonb| JSON object of mapped attributes      |


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
