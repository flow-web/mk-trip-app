import type { ReactNode, CSSProperties } from 'react'

export function Eyebrow({
  children,
  style,
  className = '',
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={`mk-eyebrow ${className}`} style={style}>
      {children}
    </div>
  )
}
