import type { SlatePluginConfig } from 'platejs'

import { BaseFontBackgroundColorPlugin, BaseFontColorPlugin, BaseFontFamilyPlugin, BaseFontSizePlugin } from '@platejs/basic-styles'
import { KEYS } from 'platejs'

import { adjustForTheme, type ContrastTheme } from './font-contrast'

const options = {
  inject: { targetPlugins: [KEYS.p] },
} satisfies SlatePluginConfig

export const ThemeAwareBaseFontColorPlugin = BaseFontColorPlugin.configure(options)
  .extend({ options: { theme: undefined as ContrastTheme | undefined } })
  .extend({
    inject: {
      nodeProps: {
        transformNodeValue: ({ getOptions, nodeValue }) => adjustForTheme(String(nodeValue ?? ''), getOptions().theme),
      },
    },
  })

export const ThemeAwareBaseFontBackgroundColorPlugin = BaseFontBackgroundColorPlugin.configure(options)
  .extend({ options: { theme: undefined as ContrastTheme | undefined } })
  .extend({
    inject: {
      nodeProps: {
        transformNodeValue: ({ getOptions, nodeValue }) => adjustForTheme(String(nodeValue ?? ''), getOptions().theme),
      },
    },
  })

export const BaseFontKit = [ThemeAwareBaseFontColorPlugin, ThemeAwareBaseFontBackgroundColorPlugin, BaseFontSizePlugin.configure(options), BaseFontFamilyPlugin.configure(options)]
