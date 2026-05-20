// lib/design/fonts.ts
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google'

export const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const body = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})
