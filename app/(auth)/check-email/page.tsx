'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function Inner() {
  const email = useSearchParams().get('email')
  return (
    <div className="text-center">
      <div className="mk-eyebrow text-ink-mute">VÉRIFIE TES MAILS</div>
      <h1 className="mk-display text-4xl mt-3">On t'a envoyé<br />un lien.</h1>
      <p className="text-ink-soft mt-4 text-sm">
        Clique le lien dans le mail pour ouvrir MK Trip.<br />
        {email && <span className="mk-mono text-xs">→ {email}</span>}
      </p>
    </div>
  )
}

export default function CheckEmailPage() {
  return <Suspense fallback={null}><Inner /></Suspense>
}
