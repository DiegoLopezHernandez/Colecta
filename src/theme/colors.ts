/**
 * Paleta única de la app. Importar `colors` desde aquí en lugar de hardcodear
 * hex en cada componente. Coincide con `tailwind.config.js`.
 */
export const colors = {
  // Fondos
  bg: '#0B0B0D',
  surface: '#141417',
  surface2: '#1C1C20',
  surface3: '#26262B',

  // Bordes
  border: '#26262B',
  borderStrong: '#3A3A40',
  borderSubtle: '#1C1C20',

  // Texto
  text: '#F4F4F5',
  textMuted: '#A1A1AA',
  textSubtle: '#71717A',
  textDim: '#52525B',

  // Acento
  primary: '#D4A24B',
  primaryDim: '#A87E2E',
  primaryFg: '#1A1206', // texto sobre primary (contraste accesible)

  // Semánticos
  ok: '#4ADE80',
  warn: '#FBBF24',
  err: '#F87171',
  errSoft: '#2A1414',
  dangerFg: '#1A0606',

  // Misc
  rarity: '#C084FC',
  overlay: 'rgba(0,0,0,0.65)',
  overlaySoft: 'rgba(0,0,0,0.6)',
} as const;

export type ColorToken = keyof typeof colors;
