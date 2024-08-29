import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import tailwindAnimate from 'tailwindcss-animate'

const config: Pick<
  Config,
  'prefix' | 'content' | 'presets' | 'extend' | 'plugins'
> = {
  content: ['./src/**/*.tsx'],
  presets: [sharedConfig],
  plugins: [tailwindAnimate],
  extend: {
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
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
  },
}

export default config
