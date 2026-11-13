import { createClient } from '@supabase/supabase-js'

const URL = 'https://gjknwzwryoahvlcbjrqi.supabase.co'
export const supabase = createClient(URL, 'sb_publishable_5gJ0riYHCCPffhahB0lQ7A_ZThO-FXG')

// Where supabase-js keeps the session; the same key the prototype used, so people stay signed in.
export const AUTH_STORAGE_KEY = `sb-${new globalThis.URL(URL).hostname.split('.')[0]}-auth-token`

// Preview links use a separate table so trying out a change never touches the real books.
export const IS_LIVE = location.hostname === 'taegansheena.github.io'
export const TABLE = IS_LIVE ? 'books' : 'preview_books'
