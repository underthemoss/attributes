// Script to create the 'documents' bucket in Supabase Storage
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createBucket() {
  // Initialize Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Create the bucket with public read access
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: true, // Set to true for public access, false for private
      fileSizeLimit: 10485760, // 10MB limit (adjust as needed)
    });

    if (error) {
      console.error('Error creating bucket:', error.message);
      return;
    }

    console.log('✅ Documents bucket created successfully!');
    console.log(data);
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

createBucket();
