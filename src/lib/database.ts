import { supabaseAdmin } from './supabase-admin';

/**
 * Utility functions for database operations
 */

/**
 * Ensures all necessary tables exist in the database
 */
export async function ensureDatabaseSetup() {
  try {
    // Create superadmins table if it doesn't exist
    await ensureSuperadminsTable();
    // Add more table creation checks here as needed
    return { success: true };
  } catch (error) {
    console.error('Error in database setup:', error);
    return { success: false, error };
  }
}

/**
 * Creates the superadmins table if it doesn't exist
 */
export async function ensureSuperadminsTable() {
  try {
    // First check if the table exists
    const { error: checkError } = await supabaseAdmin
      .from('superadmins')
      .select('id')
      .limit(1);

    // If there's no error, the table exists
    if (!checkError) {
      return { exists: true };
    }

    // Try to create the table with SQL
    const { error: createError } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS superadmins (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          username TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // If the RPC method failed or doesn't exist, try a direct insert
    // This might fail but it's a fallback attempt
    if (createError) {
      console.error('Failed to create superadmins table via RPC:', createError);
      throw new Error('Failed to create superadmins table. You may need to create it manually in your Supabase dashboard.');
    }

    return { created: true };
  } catch (error) {
    console.error('Error ensuring superadmins table:', error);
    throw error;
  }
} 