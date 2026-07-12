import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pysctkfvugetokzkloui.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zBj5m0ocJR6EaV1YkCE7KA_7fsQc5Js'

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

export const BRAND_NAME_AR = 'روابي الفجرية'
export const BRAND_NAME_EN = 'Rawabi Al Fajrya'
export const ADMIN_EMAIL = 'admin@rawabi-alfajrya.com'
export const WHATSAPP_NUMBER = '96877222686'
export const WHATSAPP_DISPLAY = '+968 7722 2686'
export const INSTAGRAM_HANDLE = 'rawabi.alfajrya'
export const INSTAGRAM_URL = 'https://instagram.com/rawabi.alfajrya'
