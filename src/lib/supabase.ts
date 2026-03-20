import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabaseCookieName() {
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
  return `sb-${projectId}-auth-token`;
}

// For client-side usage (browser)
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    cookieOptions: {
      name: getSupabaseCookieName(),
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    global: {
      headers: {
        'x-application-name': 'superadmin-panel',
      },
    },
  }
);

// Types for our database models
export type Society = {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type Admin = {
  id: string;
  username: string;
  society_id: string;
  created_at: string;
  updated_at: string;
};

export type SuperAdmin = {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type LICRequest = {
  id: string;
  user_id: string;
  society_id: string;
  resident_name: string;
  policy_number?: string;
  request_type: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}; 