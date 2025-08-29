import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import containerQueries from '@tailwindcss/container-queries'

const config: Config = {
  darkMode: 'class',
  content: ['./src/app/**/*.{ts,tsx,js,jsx}', './src/components/**/*.{ts,tsx,js,jsx}'],
  presets: [sharedConfig],
  plugins: [containerQueries],
}

export default config
