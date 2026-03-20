import { supabaseAdmin } from './supabase-admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Create a server-side Supabase client for authentication
export async function createServerSupabaseClient() {
  const cookieStore: any = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Check if the user is authenticated as a superadmin
export async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Check if user is a superadmin in your database
  const { data: superadmin, error } = await supabaseAdmin
    .from('superadmins')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error || !superadmin) {
    redirect('/auth/login');
  }
  
  return { session, superadmin };
}

// Log in a user
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

// Log out a user
export async function signOutUser() {
  const { error } = await supabaseAdmin.auth.signOut();
  return { error };
}

// Create a new admin user and assign them to a society
export async function createAdmin(username: string, password: string, societyId: string) {
  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `${username}@mysocietydetails.com`,
    password,
    email_confirm: true,
  });
  
  if (authError) {
    return { error: authError };
  }
  
  // Add user to admins table
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admins')
    .insert({
      id: authData.user.id,
      username,
      society_id: societyId,
    })
    .select()
    .single();
  
  if (adminError) {
    // Clean up auth user if admin creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { error: adminError };
  }
  
  return { data: adminData };
} 