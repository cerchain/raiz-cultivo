import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymtkfdjshhlfezghteja.supabase.co'
const supabaseKey = 'sb_publishable_O55A96TRQHE_Tbjj-4WekQ_erW9ANdv'

export const supabase = createClient(supabaseUrl, supabaseKey)
