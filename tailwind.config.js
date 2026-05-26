/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Fondos (neutros, no azules — eliminan la sensación de "letras flotando")
        bg: '#0B0B0D',          // fondo base
        surface: '#141417',     // tarjetas, paneles
        surface2: '#1C1C20',    // inputs, pressables
        surface3: '#26262B',    // hover / estado activo
        border: '#26262B',      // bordes sutiles
        borderStrong: '#3A3A40',// bordes destacados

        // Texto (jerarquía clara, sin negros sobre azul)
        text: '#F4F4F5',        // texto principal
        textMuted: '#A1A1AA',   // texto secundario
        textSubtle: '#71717A',  // texto terciario, hints

        // Acento dorado numismático (discreto, profesional)
        primary: '#D4A24B',
        primaryDim: '#A87E2E',
        primaryFg: '#1A1206',   // texto sobre primary

        // Semánticos
        ok: '#4ADE80',
        warn: '#FBBF24',
        err: '#F87171',

        // Alias retrocompatibles (no romper código existente)
        accent: '#D4A24B',
        muted: '#A1A1AA',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '18px'],
        base: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
      },
      spacing: {
        screen: '16px',
      },
    },
  },
  plugins: [],
};
