# Database Schema for construction-attribute-ingestor

This document describes the schema for the Supabase (PostgreSQL) database backing this project.

## Tables

### attribute_definitions
- `id uuid PRIMARY KEY`
- `internal_name text UNIQUE NOT NULL`
- `display_name text NOT NULL`
- `description text`
- `data_type text NOT NULL`
- `unit text`
- `concept_ids uuid[]`
- `synonyms text[]`
- `constraints jsonb`

### attribute_groups
- `id uuid PRIMARY KEY`
- `name text UNIQUE NOT NULL`
- `description text`

### documents
- `id uuid PRIMARY KEY`
- `storage_path text NOT NULL`
- `status text DEFAULT 'pending'`
- `uploaded_at timestamptz DEFAULT now()`
- `processed_at timestamptz`
- `error_message text`

### group_attributes
- `group_id uuid`
- `attribute_id uuid`
- PRIMARY KEY (`group_id`, `attribute_id`)
- FOREIGN KEY (`group_id`) REFERENCES `attribute_groups(id)`
- FOREIGN KEY (`attribute_id`) REFERENCES `attribute_definitions(id)`

### product_attribute_values
- `product_id uuid`
- `attribute_id uuid`
- `value text NOT NULL`
- PRIMARY KEY (`product_id`, `attribute_id`)
- FOREIGN KEY (`product_id`) REFERENCES `products(id)`
- FOREIGN KEY (`attribute_id`) REFERENCES `attribute_definitions(id)`

### product_metadata
- `product_id uuid`
- `key text`
- `value text`
- PRIMARY KEY (`product_id`, `key`)
- FOREIGN KEY (`product_id`) REFERENCES `products(id)`

### products
- `id uuid PRIMARY KEY`
- `name text NOT NULL`
- `description text`
- `search_vector tsvector` (generated for full-text search)

### raw_attributes
- `id integer PRIMARY KEY`
- `document_id uuid`
- `attribute_internal_name text`
- `raw_value text`
- `created_at timestamptz DEFAULT now()`
- FOREIGN KEY (`document_id`) REFERENCES `documents(id)`

## Indexes
- `idx_documents_status` on `documents(status)`
- `idx_documents_uploaded_at` on `documents(uploaded_at)`
- `idx_products_name_trgm` on `products(name)` (trigram index)
- `idx_products_search_vector` on `products(search_vector)`
- `raw_attributes_document_id_idx` on `raw_attributes(document_id)`

## Sequences
- `raw_attributes_id_seq` for `raw_attributes.id`

## Constraints
- Unique and primary keys as described above
- Foreign keys for all relationships

---

For full DDL, see `exported_supabase_schema.sql`.
