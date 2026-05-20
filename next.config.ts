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
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
