import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import containerQueries from '@tailwindcss/container-queries'

const config: Config = {
  darkMode: 'class',
  safelist: ['dark', 'bg-red-50', 'bg-green-50', 'bg-yellow-50', 'bg-red-200', 'bg-green-200', 'bg-yellow-500', 'text-red-700', 'text-green-700', 'text-slate-700'],
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}', // ✅ your Next.js app folder
    './src/components/**/*.{ts,tsx,js,jsx}', // ✅ if you keep components here
  ],
  presets: [sharedConfig],
  plugins: [containerQueries],
}

export default config
