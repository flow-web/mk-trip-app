'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function Inner() {
  const email = useSearchParams().get('email')
  const router = useRouter()
  return (
    <div className="text-center">
      <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">CONFIRME TON EMAIL</div>
      <h1 className="mk-display text-4xl mt-3">Presque<br />là !</h1>
      <p className="text-ink-soft dark:text-ink-soft-dark mt-4 text-sm">
        Clique le lien de confirmation dans le mail pour activer ton compte.<br />
        {email && <span className="mk-mono text-xs">→ {email}</span>}
      </p>
      <button
        type="button"
        onClick={() => router.push('/welcome')}
        className="mt-8 mk-mono text-[11px] text-ink-mute dark:text-ink-mute-dark underline"
      >
        ← Retour à la connexion
      </button>
    </div>
  )
}

export default function CheckEmailPage() {
  return <Suspense fallback={null}><Inner /></Suspense>
}
