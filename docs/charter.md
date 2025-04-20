# Project Charter

**Goal:**  
Build a CQRS‑style ingestion platform that parses uploaded spec‑sheet documents into structured products defined by atomic, physics‑based attributes.

**Scope (Phase 1):**  
- Supabase schema (attributes, groups, products)  
- FTS + trigram search in Postgres  
- GPT‑API ingestion worker stub  
- Upload UI + basic faceted filter

**Out of Scope:**  
- OCR  
- Mobile client  
- Multi‑tenant billing

**Success Criteria:**  
User can upload a PDF, see a reconstructed product with attribute‑values, and filter/search in the UI.
