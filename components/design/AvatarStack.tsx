import { Avatar } from './Avatar'

interface Person {
  initials: string
  color: string
}

interface Props {
  people: Person[]
  size?: number
  max?: number
  bgRing?: string
  overflowBg?: string
}

export function AvatarStack({
  people,
  size = 24,
  max = 4,
  bgRing = '#F2EDE3',
  overflowBg = '#1C1A17',
}: Props) {
  const shown = people.slice(0, max)
  const overflow = people.length - max
  return (
    <div className="flex">
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar
            name={p.initials}
            size={size}
            bg={p.color}
            border={`2px solid ${bgRing}`}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div style={{ marginLeft: -size * 0.32 }}>
          <Avatar
            name={`+${overflow}`}
            size={size}
            bg={overflowBg}
            border={`2px solid ${bgRing}`}
          />
        </div>
      )}
    </div>
  )
}
