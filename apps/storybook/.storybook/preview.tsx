import React from 'react'
import type { Preview } from '@storybook/react-vite'
import { addons, useEffect } from 'storybook/preview-api'
import { withThemeByClassName } from '@storybook/addon-themes'
import './style.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, enabled: false } },
})

const QueryClientDecorator = (Story: React.ComponentType) => (
  <QueryClientProvider client={queryClient}>
    <Story />
  </QueryClientProvider>
)

// Module-level listener covers docs mode where story decorators don't affect the outer page.
addons.getChannel().on('globalsUpdated', ({ userGlobals }: { userGlobals: Record<string, string> }) => {
  const isDark = userGlobals?.['theme'] === 'dark'
  const bg = isDark ? '#09151d' : '#eff4f5'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.backgroundColor = bg
  if (document.body) {
    document.body.classList.toggle('dark', isDark)
    document.body.style.backgroundColor = bg
  }
})

const preview: Preview = {
  decorators: [
    QueryClientDecorator,
    (Story, context) => {
      const isDark = context.globals['theme'] === 'dark'

      // useEffect from storybook/preview-api re-runs when globals change in story mode.
      useEffect(() => {
        const bg = isDark ? '#09151d' : '#eff4f5'
        document.documentElement.style.backgroundColor = bg
        document.documentElement.classList.toggle('dark', isDark)
        if (document.body) {
          document.body.style.backgroundColor = bg
          document.body.classList.toggle('dark', isDark)
        }
      }, [isDark])

      return <Story />
    },
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
  parameters: {
    tags: ['autodocs'],
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
}

export default preview
