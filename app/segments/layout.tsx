import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Segments — MK Trip',
}

export default function SegmentsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_SEGMENTS_ENABLED !== 'true') {
    notFound()
  }
  return <div className="min-h-dvh">{children}</div>
}
