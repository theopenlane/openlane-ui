import React from 'react'
import type { Preview } from '@storybook/react-vite'
import { useEffect } from 'storybook/preview-api'
import { withThemeByClassName } from '@storybook/addon-themes'
import './style.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import openlaneLight from './openlane'
import openlaneDark from './openlane-dark'

const DARK_BG = '#09151d'
const LIGHT_BG = '#eff4f5'

const QueryClientDecorator = (Story: React.ComponentType, context: { id: string }) => {
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    [],
  )

  useEffect(() => {
    queryClient.clear()
  }, [context.id, queryClient])

  useEffect(() => {
    return () => {
      queryClient.clear()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

function applyTheme(isDark: boolean) {
  const bg = isDark ? DARK_BG : LIGHT_BG
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.backgroundColor = bg
  if (document.body) {
    document.body.classList.toggle('dark', isDark)
    document.body.style.backgroundColor = bg
  }
}

const preview: Preview = {
  decorators: [
    QueryClientDecorator,
    (Story, context) => {
      const isDark = context.globals['theme'] === 'dark'

      // Switch the Storybook docs chrome theme (controls tables, code blocks, text) to
      // match the selected theme. Mutating context.parameters here is intentional — it
      // is the established pattern for making parameters.docs.theme dynamic.
      context.parameters.docs = {
        ...context.parameters.docs,
        theme: isDark ? openlaneDark : openlaneLight,
      }

      useEffect(() => {
        applyTheme(isDark)
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
