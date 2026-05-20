import { CalendarPlus, MapPin, Plus, Receipt } from 'lucide-react'

export function QuickActions({ tripId }: { tripId: string }) {
  const items = [
    {
      Icon: Receipt,
      label: 'Dépense',
      href: `/trips/${tripId}/budget?new=1`,
    },
    {
      Icon: MapPin,
      label: 'Spot',
      href: `/trips/${tripId}/map?new=1`,
    },
    {
      Icon: CalendarPlus,
      label: 'Jour',
      href: `/trips/${tripId}/planning?new=1`,
    },
  ]
  return (
    <section className="px-5 mt-6 mb-6">
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ Icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="bg-white rounded-md border border-hairline p-3 flex flex-col gap-1.5 relative"
          >
            <div className="w-7 h-7 bg-paper rounded-xs flex items-center justify-center">
              <Icon className="w-4 h-4 text-ink" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-medium">{label}</div>
            <Plus
              className="absolute top-3 right-3 w-3.5 h-3.5 text-ink-mute"
              strokeWidth={2}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
