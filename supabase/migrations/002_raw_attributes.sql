-- 002_raw_attributes.sql
create table raw_attributes (
  id serial primary key,
  document_id uuid not null references documents(id),
  attribute_internal_name text not null,
  raw_value text not null,
  created_at timestamptz default now()
);
create index on raw_attributes(document_id);
