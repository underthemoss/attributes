-- Enable extensions
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Attribute Definitions
create table attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  internal_name text not null unique,
  display_name text not null,
  description text,
  data_type text not null,
  unit text,
  concept_ids uuid[] default '{}',
  synonyms text[] default '{}',
  constraints jsonb default '{}'
);

-- Attribute Groups
create table attribute_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- Join group ↔ definitions
create table group_attributes (
  group_id uuid references attribute_groups(id),
  attribute_id uuid references attribute_definitions(id),
  primary key(group_id, attribute_id)
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

-- Product Attribute Values
create table product_attribute_values (
  product_id uuid references products(id),
  attribute_id uuid references attribute_definitions(id),
  value text not null,
  primary key(product_id, attribute_id)
);

-- Product Metadata
create table product_metadata (
  product_id uuid references products(id),
  key text not null,
  value text not null,
  primary key(product_id, key)
);

-- Full‑text search vector on products
alter table products
  add column search_vector tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) stored;
create index idx_products_search_vector on products using gin(search_vector);

-- Trigram index on name
create index idx_products_name_trgm on products using gin(name gin_trgm_ops);
