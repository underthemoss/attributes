create table documents (
  id             uuid      primary key default gen_random_uuid(),
  path           text      not null,
  status         text      not null default 'pending',
  uploaded_at    timestamptz default now(),
  processed_at   timestamptz,
  error_message  text
);

create index on documents(status);
create index on documents(uploaded_at);
