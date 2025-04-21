--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.12 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attribute_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    internal_name text NOT NULL,
    display_name text NOT NULL,
    description text,
    data_type text NOT NULL,
    unit text,
    concept_ids uuid[] DEFAULT '{}'::uuid[],
    synonyms text[] DEFAULT '{}'::text[],
    constraints jsonb DEFAULT '{}'::jsonb
);


--
-- Name: attribute_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    storage_path text NOT NULL,
    status text DEFAULT 'pending'::text,
    uploaded_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    error_message text
);


--
-- Name: group_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_attributes (
    group_id uuid NOT NULL,
    attribute_id uuid NOT NULL
);


--
-- Name: product_attribute_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_attribute_values (
    product_id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    value text NOT NULL
);


--
-- Name: product_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_metadata (
    product_id uuid NOT NULL,
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    search_vector tsvector GENERATED ALWAYS AS ((setweight(to_tsvector('english'::regconfig, COALESCE(name, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(description, ''::text)), 'B'::"char"))) STORED
);


--
-- Name: raw_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.raw_attributes (
    id integer NOT NULL,
    document_id uuid NOT NULL,
    attribute_internal_name text NOT NULL,
    raw_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: raw_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.raw_attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: raw_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.raw_attributes_id_seq OWNED BY public.raw_attributes.id;


--
-- Name: raw_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_attributes ALTER COLUMN id SET DEFAULT nextval('public.raw_attributes_id_seq'::regclass);


--
-- Name: attribute_definitions attribute_definitions_internal_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_definitions
    ADD CONSTRAINT attribute_definitions_internal_name_key UNIQUE (internal_name);


--
-- Name: attribute_definitions attribute_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_definitions
    ADD CONSTRAINT attribute_definitions_pkey PRIMARY KEY (id);


--
-- Name: attribute_groups attribute_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_groups
    ADD CONSTRAINT attribute_groups_name_key UNIQUE (name);


--
-- Name: attribute_groups attribute_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_groups
    ADD CONSTRAINT attribute_groups_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: group_attributes group_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_attributes
    ADD CONSTRAINT group_attributes_pkey PRIMARY KEY (group_id, attribute_id);


--
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (product_id, attribute_id);


--
-- Name: product_metadata product_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata
    ADD CONSTRAINT product_metadata_pkey PRIMARY KEY (product_id, key);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: raw_attributes raw_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_attributes
    ADD CONSTRAINT raw_attributes_pkey PRIMARY KEY (id);


--
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- Name: idx_documents_uploaded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_uploaded_at ON public.documents USING btree (uploaded_at);


--
-- Name: idx_products_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name_trgm ON public.products USING gin (name public.gin_trgm_ops);


--
-- Name: idx_products_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_search_vector ON public.products USING gin (search_vector);


--
-- Name: raw_attributes_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX raw_attributes_document_id_idx ON public.raw_attributes USING btree (document_id);


--
-- Name: group_attributes group_attributes_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_attributes
    ADD CONSTRAINT group_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attribute_definitions(id);


--
-- Name: group_attributes group_attributes_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_attributes
    ADD CONSTRAINT group_attributes_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.attribute_groups(id);


--
-- Name: product_attribute_values product_attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attribute_definitions(id);


--
-- Name: product_attribute_values product_attribute_values_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_metadata product_metadata_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata
    ADD CONSTRAINT product_metadata_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: raw_attributes raw_attributes_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_attributes
    ADD CONSTRAINT raw_attributes_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- PostgreSQL database dump complete
--

