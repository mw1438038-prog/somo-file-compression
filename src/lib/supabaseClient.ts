import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

try {
  const parsedUrl = new URL(supabaseUrl);
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(
    parsedUrl.hostname,
  );
  if (parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && isLocalhost)) {
    throw new Error();
  }
} catch {
  throw new Error(
    'VITE_SUPABASE_URL must be an HTTPS URL (or a localhost HTTP URL for development).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
