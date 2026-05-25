'use client'

import { Car, Footprints, Bike } from 'lucide-react'

type Profile = 'driving' | 'walking' | 'cycling'

interface Props {
  value: Profile
  onChange: (profile: Profile) => void
}

const MODES: Array<{ profile: Profile; Icon: typeof Car; label: string }> = [
  { profile: 'driving', Icon: Car, label: 'Voiture' },
  { profile: 'walking', Icon: Footprints, label: 'À pied' },
  { profile: 'cycling', Icon: Bike, label: 'Vélo' },
]

export function TransportModeToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-white/90 dark:bg-paper-dark/90 backdrop-blur rounded-full p-1 shadow-sm">
      {MODES.map(({ profile, Icon, label }) => (
        <button
          key={profile}
          type="button"
          onClick={() => onChange(profile)}
          title={label}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
            value === profile
              ? 'bg-ink text-white shadow-sm'
              : 'text-ink-mute hover:text-ink'
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}
