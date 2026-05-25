import { CalendarPlus, MapPin, Plus, Receipt, Timer, BarChart3, Car, Vote } from 'lucide-react'

export function QuickActions({ tripId }: { tripId: string }) {
  const items = [
    {
      Icon: Receipt,
      label: 'Dépense',
      href: `/trips/${tripId}/budget`,
    },
    {
      Icon: MapPin,
      label: 'Spot',
      href: `/trips/${tripId}/map`,
    },
    {
      Icon: CalendarPlus,
      label: 'Jour',
      href: `/trips/${tripId}/planning`,
    },
    {
      Icon: Timer,
      label: 'Session',
      href: '/segments/new/live',
    },
    {
      Icon: Vote,
      label: 'Sondage',
      href: `/trips/${tripId}/polls`,
    },
    {
      Icon: Car,
      label: 'Conduite',
      href: `/trips/${tripId}/drive`,
    },
  ]
  return (
    <section className="px-5 mt-6 mb-6">
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ Icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-3 flex flex-col gap-1.5 relative"
          >
            <div className="w-7 h-7 bg-paper dark:bg-paper-dark rounded-xs flex items-center justify-center">
              <Icon className="w-4 h-4 text-ink dark:text-ink-dark" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-medium">{label}</div>
            <Plus
              className="absolute top-3 right-3 w-3.5 h-3.5 text-ink-mute dark:text-ink-mute-dark"
              strokeWidth={2}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
