'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { seedDemoData } from '@/lib/demo/seed'

type Mode = 'login' | 'signup'

export default function WelcomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) { setErr(error.message); return }
      router.push('/trips')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setLoading(false)
      if (error) { setErr(error.message); return }
      if (data.user && !data.session) {
        router.push(`/check-email?email=${encodeURIComponent(email)}`)
      } else {
        router.push('/trips')
      }
    }
  }

  async function onDemo() {
    setDemoLoading(true)
    try {
      await seedDemoData()
      router.push('/demo' as any)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div>
      <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">MK TRIP</div>
      <h1 className="mk-display text-5xl mt-3">
        Le carnet<br />de bord<br />
        <span className="mk-display-italic" style={{ color: '#C75A20' }}>du crew.</span>
      </h1>
      <p className="text-ink-soft dark:text-ink-soft-dark mt-6 text-sm">
        {mode === 'login'
          ? 'Connecte-toi pour retrouver tes voyages.'
          : 'Crée ton compte en 10 secondes.'}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          required
          autoComplete="email"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={6}
        />
        <Button type="submit" disabled={loading || !email || !password} className="w-full">
          {loading
            ? (mode === 'login' ? 'Connexion...' : 'Création...')
            : (mode === 'login' ? 'Se connecter' : 'Créer un compte')}
        </Button>
        {err && <p className="text-sm text-danger">{err}</p>}
      </form>

      <p className="text-center text-xs text-ink-soft dark:text-ink-soft-dark mt-4">
        {mode === 'login' ? (
          <>
            Pas encore de compte ?{' '}
            <button type="button" onClick={() => { setMode('signup'); setErr(null) }}
              className="underline hover:text-ink dark:hover:text-ink-dark transition">
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{' '}
            <button type="button" onClick={() => { setMode('login'); setErr(null) }}
              className="underline hover:text-ink dark:hover:text-ink-dark transition">
              Se connecter
            </button>
          </>
        )}
      </p>

      <div className="mt-10 pt-6 border-t border-hairline dark:border-hairline-dark">
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">
          OU EXPLORER SANS COMPTE
        </div>
        <p className="text-ink-soft dark:text-ink-soft-dark text-xs mt-2 max-w-[300px]">
          Lina &amp; Tom ont déjà préparé trois voyages — Lisbonne, Corse, Dolomites.
          Tu vois tout en condition réelle, sans toucher la base de données.
        </p>
        <button
          type="button"
          onClick={onDemo}
          disabled={demoLoading}
          className="mt-4 w-full text-left flex items-center justify-between px-4 py-3 rounded-sm border border-hairline dark:border-hairline-dark hover:bg-paper-deep dark:hover:bg-paper-dark-deep transition disabled:opacity-50"
        >
          <span className="font-medium text-sm">
            {demoLoading ? 'Préparation...' : 'Explorer en mode démo'}
          </span>
          <span className="mk-mono text-xs text-ink-mute dark:text-ink-mute-dark">→</span>
        </button>
      </div>
    </div>
  )
}
