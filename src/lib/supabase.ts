import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rutsjhlnmkgrflvqddez.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_vM1xs4NeXQgKIzi4_fbodQ_rGdqU17r'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export async function getSupabaseAuthSettings() {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) return null
    return (await response.json()) as { external?: { google?: boolean } }
  } catch {
    return null
  }
}

export const ADMIN_EMAIL = 'admin@f9-flowers.com'
export const WHATSAPP_NUMBER = '96877222686'
export const WHATSAPP_DISPLAY = '+968 7722 2686'
export const INSTAGRAM_HANDLE = 'F9.FLOWER'
export const INSTAGRAM_URL = 'https://instagram.com/f9.flower'
