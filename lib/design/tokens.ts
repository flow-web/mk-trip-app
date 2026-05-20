// lib/design/tokens.ts — single source of truth for MK Trip design system
export const MK = {
  paper: '#F2EDE3',
  paperDeep: '#E8E0CF',
  sand: '#DDD2BD',
  ink: '#1C1A17',
  inkSoft: '#3D362C',
  inkMute: '#7A6F60',
  hairline: 'rgba(28,26,23,.08)',
  hairlineStrong: 'rgba(28,26,23,.16)',

  paperDark: '#16140F',
  paperDarkDeep: '#1F1C16',
  sandDark: '#2A251D',
  inkDark: '#F2EDE3',
  inkSoftDark: '#CFC6B4',
  inkMuteDark: '#8B8273',
  hairlineDark: 'rgba(242,237,227,.10)',
  hairlineStrongDark: 'rgba(242,237,227,.20)',

  skate:   { base: '#C75A20', deep: '#8C3A0F', tint: '#F4E2D2', tintDark: '#3A1E0F' },
  rando:   { base: '#5A6E3E', deep: '#3A4925', tint: '#E5E6D6', tintDark: '#1F2515' },
  surf:    { base: '#1E3A5C', deep: '#0F2238', tint: '#DCE3EB', tintDark: '#10202F' },
  city:    { base: '#B14E32', deep: '#7A3018', tint: '#F1DDD2', tintDark: '#341A11' },
  road:    { base: '#C99748', deep: '#8A6722', tint: '#F1E2C1', tintDark: '#3A2E14' },
  neutral: { base: '#3D362C', deep: '#1C1A17', tint: '#E1DACD', tintDark: '#2A251D' },

  danger: '#A33A2A',
  ok: '#5A6E3E',
} as const

export type AccentTokens = typeof MK.skate
