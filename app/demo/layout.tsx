'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  return (
    <>
      {children}
      <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="mx-4 mb-4 md:mx-auto md:max-w-md pointer-events-auto">
          <Link
            href="/welcome"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-ink dark:bg-white text-white dark:text-ink shadow-lg hover:opacity-90 transition"
          >
            <div>
              <div className="text-sm font-medium">Convaincu ?</div>
              <div className="text-[11px] opacity-70">Crée ton compte gratuitement</div>
            </div>
            <span className="mk-mono text-xs opacity-70">→</span>
          </Link>
        </div>
      </div>
    </>
  )
}
