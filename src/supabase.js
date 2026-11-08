import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pqhakpqcbndhgienvjzw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_PjVJXvyeP5IH1ZIRmqIpQ_lOXZ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
