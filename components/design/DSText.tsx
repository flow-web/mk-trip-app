import type { ReactNode, CSSProperties } from 'react'

type T = { children: ReactNode; className?: string; style?: CSSProperties }

export const Display = ({ children, className = '', style }: T) => (
  <span className={`mk-display ${className}`} style={style}>
    {children}
  </span>
)

export const DisplayItalic = ({ children, className = '', style }: T) => (
  <span className={`mk-display-italic ${className}`} style={style}>
    {children}
  </span>
)

export const Heading = ({ children, className = '', style }: T) => (
  <span className={`font-display font-bold tracking-tight ${className}`} style={style}>
    {children}
  </span>
)

export const Body = ({ children, className = '', style }: T) => (
  <span className={`font-body ${className}`} style={style}>
    {children}
  </span>
)

export const Mono = ({ children, className = '', style }: T) => (
  <span className={`mk-mono ${className}`} style={style}>
    {children}
  </span>
)
