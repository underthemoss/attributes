# Architecture Overview

- **Command API** (NestJS + CQRS) → writes events to Event Store + Supabase  
- **Ingestion Worker** (Node.js) → listens for DocumentUploaded, calls GPT‑API, emits ProductExtracted  
- **Read Side** → Postgres (Supabase) + FTS/trigram for search  
- **UI** → React/Vite for upload, search, filter  
- **Event Bus** → RabbitMQ or Kafka (for Phase 1 can be stubbed)
