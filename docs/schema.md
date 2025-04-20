# Database Schema

See `supabase/migrations/001_initial_schema.sql` for full DDL.  
Key tables:  
- attribute_definitions  
- attribute_groups  
- attribute_templates  
- products  
- product_attribute_values  
- product_metadata  
- search_vector on products for FTS  
- pg_trgm extension for name trigram
