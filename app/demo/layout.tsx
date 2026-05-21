'use client'

import { useEffect, useState } from 'react'
import { seedDemoData } from '@/lib/demo/seed'

export default function DemoRootLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    seedDemoData()
      .catch((e) => console.warn('demo seed failed', e))
      .finally(() => setReady(true))
  }, [])
  if (!ready) {
    return (
      <main className="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center">
        <span className="mk-mono text-xs text-ink-mute dark:text-ink-mute-dark">
          CHARGEMENT DU MODE DÉMO…
        </span>
      </main>
    )
  }
  return <>{children}</>
}
