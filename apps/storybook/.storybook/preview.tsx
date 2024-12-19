import React, { useEffect, useState } from 'react'
import type { Preview } from '@storybook/react'
import './style.css'
import '../../../packages/ui/dist/index.css';
import { themes } from '@storybook/theming';

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

export const parameters = {
  darkMode: {
    current: 'light',
    stylePreview: true,
    // Override the default dark theme
    dark: {
      ...themes.dark,

      colorPrimary: '#2CCBAB',
      colorSecondary: '#75D2BF',

      // UI
      appBg: '#0D1117',
      appContentBg: '#0D1117',
      appPreviewBg: '#0D1117',
      appBorderColor: '#303E4A',
      appBorderRadius: 4,

      // Text colors
      textColor: '#bdd9e1',
      textInverseColor: '#505F6F',

      // Toolbar default and active colors
      barTextColor: '#aabec5',
      barSelectedColor: '#354755',
      barHoverColor: '#354755',
      barBg: '#1C2630',

      // Form colors
      inputBg: '#1C2630',
      inputBorder: '#0D1117',
      inputTextColor: '#aabec5',
      inputBorderRadius: 2,
    },
    // Override the default light theme
    light: {
      ...themes.light,

      colorPrimary: '#2CCBAB',
      colorSecondary: '#75D2BF',

      // UI
      appBg: '#e9f1f5',
      appContentBg: '#e9f1f5',
      appPreviewBg: '#e9f1f5',
      appBorderColor: '#d2e2e9',
      appBorderRadius: 4,

      // Text colors
      textColor: '#505F6F',
      textInverseColor: '#1c2630',

      // Toolbar default and active colors
      barTextColor: '#303E4A',
      barSelectedColor: '#e9f1f5',
      barHoverColor: '#e9f1f5',
      barBg: '#ffffff',

      // Form colors
      inputBg: '#ffffff',
      inputBorder: '#d2e2e9',
      inputTextColor: '#505F6F',
      inputBorderRadius: 2,
    },
  }
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    tags: [
      'autodocs',
    ],
    backgrounds: {
      disable: true,
    },
    darkMode: parameters.darkMode,
    decorators: [Background],
    docs: {
      theme: parameters.darkMode.current === 'dark' ? themes.dark : themes.light,
      themes: {
        dark: parameters.darkMode.dark,
        light: parameters.darkMode.light,
      },
    }
  },
}

export default preview
