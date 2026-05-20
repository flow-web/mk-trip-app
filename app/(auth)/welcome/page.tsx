'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

export default function WelcomePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div>
      <div className="mk-eyebrow text-ink-mute">MK TRIP</div>
      <h1 className="mk-display text-5xl mt-3">
        Le carnet<br />de bord<br />
        <span className="mk-display-italic" style={{ color: '#C75A20' }}>du crew.</span>
      </h1>
      <p className="text-ink-soft mt-6 text-sm">
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
    </div>
  )
}
