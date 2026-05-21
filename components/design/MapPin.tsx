import type { ReactNode } from 'react'

interface Props {
  color: string
  active?: boolean
  size?: number
  children?: ReactNode
}

export function MapPin({ color, active = false, size = 32, children }: Props) {
  const scale = active ? 1.15 : 1
  return (
    <div
      className="rounded-tl-full rounded-tr-full rounded-bl-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: color,
        transform: `rotate(-45deg) scale(${scale})`,
        boxShadow: active
          ? `0 2px 8px ${color}66`
          : '0 2px 6px rgba(0,0,0,.25)',
        border: '2px solid #fff',
      }}
    >
      <div style={{ transform: 'rotate(45deg)' }}>{children}</div>
    </div>
  )
}
