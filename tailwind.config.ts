import type { Config } from 'tailwindcss'
import { MK } from './lib/design/tokens'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: MK.paper,
        'paper-deep': MK.paperDeep,
        sand: MK.sand,
        ink: MK.ink,
        'ink-soft': MK.inkSoft,
        'ink-mute': MK.inkMute,
        hairline: MK.hairline,
        'hairline-strong': MK.hairlineStrong,

        'paper-dark': MK.paperDark,
        'paper-dark-deep': MK.paperDarkDeep,
        'sand-dark': MK.sandDark,
        'ink-dark': MK.inkDark,
        'ink-soft-dark': MK.inkSoftDark,
        'ink-mute-dark': MK.inkMuteDark,

        danger: MK.danger,
        ok: MK.ok,

        // shadcn semantic — pointent vers nos tokens via CSS vars (cf. globals.css)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '24px',
        pill: '9999px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        flat: '0 1px 2px rgba(0,0,0,.06)',
        card: '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)',
        sheet: '0 4px 12px rgba(0,0,0,.10), 0 16px 32px rgba(0,0,0,.08)',
      },
      letterSpacing: {
        eyebrow: '0.14em',
        tight: '-0.025em',
      },
    },
  },
  plugins: [],
}

export default config
