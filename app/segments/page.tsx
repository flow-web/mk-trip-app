import { listSegmentsInBounds } from '@/lib/segments/queries'
import { SegmentsClient } from './segments-client'

export default async function SegmentsPage() {
  const segments = await listSegmentsInBounds({
    minLng: -180,
    minLat: -85,
    maxLng: 180,
    maxLat: 85,
    limit: 200,
  })
  return <SegmentsClient initialSegments={segments} />
}
