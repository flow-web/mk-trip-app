'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { Upload } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props {
  type: TripType
  value: string | null
  onChange: (url: string, uploaded: boolean) => void
  onFileSelected?: (file: File) => void
}

export function HeroPicker({ type, value, onChange, onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const defaults = [1, 2, 3].map((i) => `/heroes/${type}/${i}.jpg`)

  return (
    <div>
      <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark mb-2">PHOTO DE COUVERTURE</div>
      <div className="grid grid-cols-3 gap-2">
        {defaults.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onChange(url, false)}
            className="relative aspect-[4/5] rounded-sm overflow-hidden"
            style={{
              outline: value === url ? '3px solid #1C1A17' : 'none',
              outlineOffset: '-3px',
            }}
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 w-full h-12 border border-dashed border-hairline-strong dark:border-hairline-strong-dark rounded-sm flex items-center justify-center gap-2 text-sm text-ink-soft dark:text-ink-soft-dark"
      >
        <Upload className="w-4 h-4" />
        Uploader la mienne
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileSelected?.(f)
        }}
      />
    </div>
  )
}
