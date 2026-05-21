'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const current = mounted ? (theme === 'system' ? resolvedTheme : theme) : null
  const isDark = current === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-2 px-2 py-2 text-sm text-ink-soft dark:text-ink-soft-dark dark:text-ink-soft dark:text-ink-soft-dark-dark"
      aria-label={isDark ? 'Passer en clair' : 'Passer en sombre'}
    >
      {mounted ? (
        isDark ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )
      ) : (
        <Moon className="w-4 h-4 opacity-0" />
      )}
      <span>
        {mounted ? (isDark ? 'Light mode' : 'Dark mode') : 'Theme'}
      </span>
    </button>
  )
}
