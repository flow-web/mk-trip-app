'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { seedDemoData } from '@/lib/demo/seed'

export default function WelcomePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    router.push(`/check-email?email=${encodeURIComponent(email)}`)
  }

  async function onDemo() {
    setDemoLoading(true)
    try {
      await seedDemoData()
      router.push('/demo' as any)
    } catch (e) {
      setErr((e as Error).message)
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
        Reçois un lien magique par email pour te connecter.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr" required autoComplete="email" />
        <Button type="submit" disabled={loading || !email} className="w-full">
          {loading ? 'Envoi…' : 'Recevoir le lien'}
        </Button>
        {err && <p className="text-sm text-danger">{err}</p>}
      </form>

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
            {demoLoading ? 'Préparation…' : 'Explorer en mode démo'}
          </span>
          <span className="mk-mono text-xs text-ink-mute dark:text-ink-mute-dark">→</span>
        </button>
      </div>
    </div>
  )
}
