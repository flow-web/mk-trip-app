'use client'

import { useEffect, useState } from 'react'

export function CountdownGo({ onGo }: { onGo: () => void }) {
  const [n, setN] = useState(3)

  useEffect(() => {
    if (n <= 0) {
      onGo()
      return
    }
    const t = setTimeout(() => setN(n - 1), 800)
    return () => clearTimeout(t)
  }, [n, onGo])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 text-paper">
      <div
        key={n}
        className="text-[160px] font-bold tabular-nums animate-[pop_0.7s_ease-out]"
        style={{ fontFamily: 'system-ui' }}
      >
        {n > 0 ? n : 'GO'}
      </div>
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
