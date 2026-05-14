'use client'

import type { PlatePluginConfig } from 'platejs/react'

import { FontBackgroundColorPlugin, FontColorPlugin, FontFamilyPlugin, FontSizePlugin } from '@platejs/basic-styles/react'
import { KEYS } from 'platejs'

import { adjustForTheme, type ContrastTheme } from './font-contrast'

const options = {
  inject: { targetPlugins: [KEYS.p] },
} satisfies PlatePluginConfig

export const ThemeAwareFontColorPlugin = FontColorPlugin.configure({
  inject: {
    ...options.inject,
    nodeProps: {
      defaultNodeValue: 'black',
    },
  },
})
  .extend({ options: { theme: undefined as ContrastTheme | undefined } })
  .extend({
    inject: {
      nodeProps: {
        transformNodeValue: ({ getOptions, nodeValue }) => adjustForTheme(String(nodeValue ?? ''), getOptions().theme),
      },
    },
  })

export const ThemeAwareFontBackgroundColorPlugin = FontBackgroundColorPlugin.configure(options)
  .extend({ options: { theme: undefined as ContrastTheme | undefined } })
  .extend({
    inject: {
      nodeProps: {
        transformNodeValue: ({ getOptions, nodeValue }) => adjustForTheme(String(nodeValue ?? ''), getOptions().theme),
      },
    },
  })

export const FontKit = [ThemeAwareFontColorPlugin, ThemeAwareFontBackgroundColorPlugin, FontSizePlugin.configure(options), FontFamilyPlugin.configure(options)]
