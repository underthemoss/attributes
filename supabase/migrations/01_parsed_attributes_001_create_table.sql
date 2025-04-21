-- Migration: create parsed_attributes table for storing GPT-4 parse results
CREATE TABLE IF NOT EXISTS public.parsed_attributes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    bucket text NOT NULL,
    parsed_json jsonb,
    parsed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parsed_attributes_file_name ON public.parsed_attributes(file_name);
