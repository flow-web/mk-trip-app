import { observable } from '@legendapp/state'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  loaded: boolean
  session: Session | null
  user: User | null
  profile: { id: string; display_name: string; avatar_url: string | null } | null
}

export const auth$ = observable<AuthState>({
  loaded: false,
  session: null,
  user: null,
  profile: null,
})

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  await setSession(data.session)
  auth$.loaded.set(true)

  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
  })
}

async function setSession(session: Session | null) {
  auth$.session.set(session)
  auth$.user.set(session?.user ?? null)
  if (session?.user) {
    await upsertProfile(session.user.id, session.user.email ?? 'Voyageur')
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', session.user.id)
      .single()
    auth$.profile.set(profile ?? null)
  } else {
    auth$.profile.set(null)
  }
}

async function upsertProfile(id: string, fallbackName: string) {
  await supabase.from('profiles').upsert(
    { id, display_name: fallbackName },
    { onConflict: 'id', ignoreDuplicates: true }
  )
}

export async function signInWithEmail(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'mktrip://auth-callback',
    },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
