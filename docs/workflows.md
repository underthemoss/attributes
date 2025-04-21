# Unified Attribute Ingestion & Assembly Workflow

## 1. Upload Document
- User uploads file to Supabase Storage (`documents` bucket) via UI
- POST to `/api/upload` with `{ storage_path }`
- Backend inserts row in `documents` table with `status='pending'`, `storage_path`

## 2. Parse & Extract Raw Attributes
- `parse.controller.ts` or ingestion worker picks up `documents.status='pending'`
- Download file, extract text (PDF/text)
- Call OpenAI GPT-4o-mini with function-calling (`recordAttributes`) to extract structured attributes
- Insert each `{ internal_name, value }` into `raw_attributes` with `document_id`
- Optionally, insert audit record into `parsed_attributes`
- Update `documents.status='extracted'`, set `processed_at=now()`

## 3. Assemble Product & Attribute Values
- `workers/assemble.ts` polls `documents.status='extracted'`
- Load all `raw_attributes` for the document
- Load `attribute_definitions` for mapping
- Call OpenAI with `createProduct` function (see `docs/schemas/assembly.schema.json`)
- Parse returned arguments:
  - Insert any `new_attributes` into `attribute_definitions`
  - Insert assembled `product` into `products`
  - Insert each `attributes[]` entry into `product_attribute_values`
- Update `documents.status='completed'`, set `processed_at=now()`
- On error, update `documents.error_message`

## 4. (Optional) Audit & Monitoring
- Use `parsed_attributes` or a dedicated audit table for traceability
- UI polls `documents` for status and progress
- Manual or automated assembly can be triggered as needed

---

**Pipeline Summary:**
1. Upload → `documents` (pending)
2. Parse (function-calling) → `raw_attributes`, status=extracted
3. Assemble → `products` + values, status=completed
4. (Optional) Audit via `parsed_attributes` or new audit table
