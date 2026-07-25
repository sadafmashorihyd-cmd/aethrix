import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvwjsmabezjwzavkdyxl.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_G0vKx-pX43bKD0Jww50WbA_p77tewMm'

export const supabase = createClient(supabaseUrl, supabaseKey)