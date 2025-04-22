alter table products
  add column attributes_json jsonb default '{}'::jsonb;
