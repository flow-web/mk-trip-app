import { Avatar } from '@/components/design/Avatar'

interface Props {
  authorName: string
  authorInitials: string
  authorColor: string
  date: string
  body: string
}

export function CrewNote({
  authorName,
  authorInitials,
  authorColor,
  date,
  body,
}: Props) {
  return (
    <div className="bg-white dark:bg-paper-dark-deep rounded-md p-3.5 border border-hairline dark:border-hairline-dark mb-2">
      <div className="flex items-center gap-2">
        <Avatar name={authorInitials} bg={authorColor} size={22} />
        <span className="text-xs font-medium">{authorName}</span>
        <span className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark ml-auto">
          {date.toUpperCase()}
        </span>
      </div>
      <div className="text-sm text-ink-soft dark:text-ink-soft-dark mt-2 leading-relaxed">{body}</div>
    </div>
  )
}
