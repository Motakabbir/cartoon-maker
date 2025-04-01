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
        black: '#000000',
        gray: {
          100: '#f3f4f6',
        },
        red: {
          500: '#ef4444',
        },
        blue: {
          500: '#3b82f6',
        }
      },
      borderRadius: {
        'DEFAULT': '0.375rem',
        'lg': '0.5rem',
      }
    },
  },
  plugins: [],
}

export default config