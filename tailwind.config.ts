import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#1a1a1a',
          900: '#111111',
          950: '#000000',
        },
        // VANHA green accent
        accent: {
          DEFAULT: '#00F59B',
          light: '#33FDB5',
          dark: '#00C77D',
        },
        // Event type colors
        holiday: '#00F59B',  // Green for public holidays
        school: '#8B5CF6',   // Purple for school
        culture: '#64748B',  // Slate gray for culture
        season: '#22D3EE',   // Cyan for seasons
        brand: '#FFFFFF',    // White for brand events
        campaign: '#00F59B', // Green for campaigns
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
