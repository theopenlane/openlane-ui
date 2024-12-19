import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'

const config: Pick<
  Config,
  'darkMode' | 'content' | 'presets' | 'prefix' | 'theme' | 'safelist' | 'mode'
> = {
  mode: 'jit',
  darkMode: 'class',
  safelist: ["dark"],
  content: ['./src/app/**/*.tsx', './src/components/**/*.tsx'],
  presets: [sharedConfig],
  theme: {
    extend: {
      colors: {
        'regal-blue': '#0D1117',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
  },
}

export default config
