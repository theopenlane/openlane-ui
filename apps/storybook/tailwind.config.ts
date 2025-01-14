import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import tailwindAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'
import plugin from 'tailwindcss/plugin'

const config = {
  mode: 'jit',
  content: ['./src/stories/**/*.{js,jsx,ts,tsx,mdx,css}', '../../packages/ui/components/**/*.{js,jsx,ts,tsx,css}'],
  darkMode: ['class', '[data-mode="dark"]'],
  safelist: ['dark'],
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
  plugins: [
    tailwindAnimate,
    typography,
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.transition-bg-ease': {
          'transition-duration': '20ms',
          'transition-property': 'background-color',
          'transition-timing-function': 'ease-in',
        },
      })
    }),
  ],
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
} satisfies Config

export default config
