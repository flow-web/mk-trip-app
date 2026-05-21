import { createClient } from '@supabase/supabase-js'
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)
for (const t of ['profiles', 'trips', 'trip_members', 'days', 'activities', 'spots', 'expenses']) {
  const r = await supa.from(t).select('*', { count: 'exact', head: false }).limit(3)
  console.log(t, '=> err:', r.error?.message ?? 'none', '| count:', r.count, '| sample:', JSON.stringify(r.data)?.slice(0, 150))
}
