import type { Config } from 'tailwindcss'
import plugin, { PluginAPI } from 'tailwindcss/plugin'
import forms from '@tailwindcss/forms'
import assistantUI from '@assistant-ui/react/tailwindcss'

const config: Config = {
  darkMode: 'class',
  plugins: [
    forms,
    plugin(function ({ addVariant }: PluginAPI) {
      addVariant('dark-hover', ['@media (prefers-color-scheme: dark)', '&:hover'])
    }),
    assistantUI({
      components: ['assistant-modal'],
      shadcn: true,
    }),
  ],
}

export default config
