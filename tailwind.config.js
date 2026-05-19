/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        surface: '#1e293b',
        surface2: '#334155',
        primary: '#3b82f6',
        accent: '#f59e0b',
        ok: '#22c55e',
        err: '#ef4444',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
};
