export type Rgb = { r: number; g: number; b: number }
export type ContrastTheme = 'light' | 'dark'

// Keep in sync with --background in packages/ui/src/styles.css (light @theme ~L187, dark .dark ~L285).
export const THEME_BACKGROUND_RGB: Record<ContrastTheme, Rgb> = {
  light: { r: 0xef, g: 0xf4, b: 0xf5 },
  dark: { r: 0x09, g: 0x15, b: 0x1d },
}

export const CONTRAST_THRESHOLD = 3.0

const NAMED_COLORS: Record<string, Rgb> = {
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
}

export const parseCssColor = (input: string): Rgb | null => {
  const value = input.trim().toLowerCase()
  if (!value || value === 'transparent' || value === 'currentcolor' || value === 'inherit') return null

  const named = NAMED_COLORS[value]
  if (named) return named

  if (value.startsWith('#')) {
    const hex = value.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      if ([r, g, b].some(Number.isNaN)) return null
      return { r, g, b }
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if ([r, g, b].some(Number.isNaN)) return null
      return { r, g, b }
    }
    return null
  }

  const rgbMatch = value.match(/^rgba?\(\s*([\d.]+)\s*[ ,]\s*([\d.]+)\s*[ ,]\s*([\d.]+)\s*(?:[ ,/]\s*[\d.%]+\s*)?\)$/)
  if (rgbMatch) {
    const r = Math.round(Number(rgbMatch[1]))
    const g = Math.round(Number(rgbMatch[2]))
    const b = Math.round(Number(rgbMatch[3]))
    if ([r, g, b].some((c) => Number.isNaN(c) || c < 0 || c > 255)) return null
    return { r, g, b }
  }

  return null
}

const channelToLinear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export const relativeLuminance = ({ r, g, b }: Rgb): number => {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
}

export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

const rgbToHsl = ({ r, g, b }: Rgb): { h: number; s: number; l: number } => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
    }
    h /= 6
  }
  return { h, s, l }
}

const hueToChannel = (p: number, q: number, t: number): number => {
  let tn = t
  if (tn < 0) tn += 1
  if (tn > 1) tn -= 1
  if (tn < 1 / 6) return p + (q - p) * 6 * tn
  if (tn < 1 / 2) return q
  if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6
  return p
}

const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }): Rgb => {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToChannel(p, q, h) * 255),
    b: Math.round(hueToChannel(p, q, h - 1 / 3) * 255),
  }
}

export const mirrorLightnessHsl = (rgb: Rgb): Rgb => {
  const hsl = rgbToHsl(rgb)
  return hslToRgb({ h: hsl.h, s: hsl.s, l: 1 - hsl.l })
}

const toHexPart = (n: number): string => n.toString(16).padStart(2, '0')

export const rgbToHex = ({ r, g, b }: Rgb): string => `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`

export const adjustForTheme = (color: string, theme: ContrastTheme | undefined): string => {
  if (!color) return color
  if (color.startsWith('var(')) return color
  if (!theme) return color

  const parsed = parseCssColor(color)
  if (!parsed) return color

  const ratio = contrastRatio(parsed, THEME_BACKGROUND_RGB[theme])
  if (ratio >= CONTRAST_THRESHOLD) return color

  return rgbToHex(mirrorLightnessHsl(parsed))
}
