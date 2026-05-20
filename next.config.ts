import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {},
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      // sera précisé en Phase 5 (Supabase Storage bucket)
    ],
  },
}

export default nextConfig
