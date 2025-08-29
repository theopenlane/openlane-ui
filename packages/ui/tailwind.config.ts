import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import tailwindAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [sharedConfig],
  plugins: [
    tailwindAnimate,
    typography,
    plugin(({ addUtilities }) => {
      addUtilities({
        '.transition-bg-ease': {
          'transition-duration': '20ms',
          'transition-property': 'background-color',
          'transition-timing-function': 'ease-in',
        },
      })
    }),
  ],
}

export default config
