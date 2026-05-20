import type { NextConfig } from 'next'
import path from 'path'
import withSerwistInit from '@serwist/next'

// Serwist génère le service worker. Note : Serwist 9 ne supporte pas encore
// Turbopack — le SW est généré uniquement quand build est lancé avec `--webpack`.
// Pour produire `public/sw.js` : `next build --no-turbopack` ou attendre
// @serwist/turbopack stable. Voir https://serwist.pages.dev/docs/next/turbo
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {},
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default withSerwist(nextConfig)
