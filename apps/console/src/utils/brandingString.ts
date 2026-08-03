import { normalizeHexColor } from '@/utils/normalizeHexColor'

const BRANDING_STRING_VERSION = 'olbrand1'

const STRING_KEYS = {
  background: 'bg',
  foreground: 'fg',
  accent: 'accent',
  secondaryBackground: 'secBg',
  secondaryForeground: 'secFg',
}

export type BrandingStringColors = {
  backgroundColor: string
  foregroundColor: string
  accentColor: string
  secondaryBackgroundColor: string
  secondaryForegroundColor: string
}

export const parseBrandingString = (value: string): BrandingStringColors | null => {
  const trimmed = value.trim()
  const separator = trimmed.indexOf(':')
  if (separator < 0 || trimmed.slice(0, separator).trim() !== BRANDING_STRING_VERSION) return null

  const colors = new Map<string, string>()

  trimmed
    .slice(separator + 1)
    .split(';')
    .forEach((pair) => {
      const [key, ...rest] = pair.split('=')
      const color = normalizeHexColor(rest.join('='))
      if (key && color) colors.set(key.trim(), color)
    })

  const backgroundColor = colors.get(STRING_KEYS.background)
  const foregroundColor = colors.get(STRING_KEYS.foreground)
  const accentColor = colors.get(STRING_KEYS.accent)
  const secondaryBackgroundColor = colors.get(STRING_KEYS.secondaryBackground)
  const secondaryForegroundColor = colors.get(STRING_KEYS.secondaryForeground)

  if (!backgroundColor || !foregroundColor || !accentColor || !secondaryBackgroundColor || !secondaryForegroundColor) return null

  return { backgroundColor, foregroundColor, accentColor, secondaryBackgroundColor, secondaryForegroundColor }
}
