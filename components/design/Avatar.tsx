interface Props {
  name: string
  size?: number
  bg?: string
  color?: string
  border?: string
}

export function Avatar({
  name,
  size = 24,
  bg = '#1C1A17',
  color = '#fff',
  border,
}: Props) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-body font-semibold"
      style={{
        width: size,
        height: size,
        background: bg,
        color,
        fontSize: size * 0.42,
        letterSpacing: '-0.02em',
        flex: 'none',
        border,
      }}
    >
      {name}
    </div>
  )
}
