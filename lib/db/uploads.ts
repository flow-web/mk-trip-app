import { supabase } from '@/lib/supabase/client'
import { db } from './index'
import { mutations } from './mutations'

export async function flushUploads() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const pending = await db.pending_uploads
    .where('status')
    .equals('pending')
    .toArray()
  for (const upload of pending) {
    await db.pending_uploads.update(upload.id, {
      status: 'uploading',
      attempts: upload.attempts + 1,
    })
    try {
      const path = `${upload.trip_id}/${upload.filename}`
      const { error } = await supabase.storage
        .from('trip-covers')
        .upload(path, upload.file, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      if (error) throw error
      const { data: pub } = supabase.storage
        .from('trip-covers')
        .getPublicUrl(path)
      await mutations.trip.update(upload.trip_id, {
        hero_image_url: pub.publicUrl,
        hero_image_uploaded: true,
      })
      await db.pending_uploads.delete(upload.id)
    } catch (err: unknown) {
      const status: 'pending' | 'failed' =
        upload.attempts >= 5 ? 'failed' : 'pending'
      await db.pending_uploads.update(upload.id, {
        status,
        last_error:
          err instanceof Error ? err.message : String(err ?? 'unknown'),
      })
    }
  }
}
