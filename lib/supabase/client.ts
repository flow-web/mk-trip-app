import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

type Client = ReturnType<typeof createBrowserClient<Database>>

let _client: Client | null = null

export function createClient(): Client {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }
  _client = createBrowserClient<Database>(url, key)
  return _client
}

// Proxy lazy : ne touche createClient() qu'au premier accès réel.
// Why: au prerender (next build), les pages statiques comme /_not-found ou /demo
// chargent transitivement ce module via DbProvider. Sans le Proxy, l'init top-level
// crashait quand les NEXT_PUBLIC_SUPABASE_* étaient absentes côté CI.
export const supabase = new Proxy({} as Client, {
  get(_, prop) {
    return Reflect.get(createClient(), prop as keyof Client)
  },
})
