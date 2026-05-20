// lib/design/fonts.ts
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google'

export const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700', '800'],
  style: 'normal',
  display: 'swap',
})

// Bricolage Grotesque has no italic variant on Google Fonts.
// We declare a separate font instance for the --font-display-italic CSS variable;
// CSS will apply font-style: italic, which triggers synthetic italic rendering.
export const displayItalic = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display-italic',
  weight: ['500'],
  style: 'normal',
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
