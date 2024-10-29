import React, { useEffect, useState } from 'react'
import Openlane from './openlane'
import type { Preview } from '@storybook/react'
import './style.css'
import '@repo/ui/styles.css';

const Background = (Story, context) => {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    if (context.args.theme) {
      setTheme(context.args.theme)
    }
  }, [context.args.theme])

  return (
    <div data-theme={theme}>
      <Story />
    </div>
  )
}


const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    tags: [
      'autodocs',
    ],
    fonts: {
      default: 'outfit',
      values: [
        { name: 'outfit', value: 'Outfit' },
        { name: 'mincho', value: 'Mincho' },
      ],
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#e9f1f5' },
        { name: 'dark', value: '#303e4a' },
        { name: 'white', value: '#FFFFFF' },
      ],
    },
    docs: {
      theme: Openlane,
    },
  },
  decorators: [Background],
}

export default preview
