import { contrastRatio, parseCssColor, relativeLuminance } from '@repo/ui/components/editor/plugins/font-contrast.ts'

export const WHITE_HEX = '#ffffff'
const BLACK_HEX = '#000000'

export const MIN_TEXT_CONTRAST = 4.5
export const MIN_LARGE_TEXT_CONTRAST = 3

const LIGHT_SURFACE_MIN_LUMINANCE = 0.5

export const meetsContrast = (foreground: string, background: string, minimum: number): boolean => {
  const foregroundRgb = parseCssColor(foreground)
  const backgroundRgb = parseCssColor(background)
  return !!foregroundRgb && !!backgroundRgb && contrastRatio(foregroundRgb, backgroundRgb) >= minimum
}

export const readableTextColor = (background: string): string => {
  const backgroundRgb = parseCssColor(background)
  if (!backgroundRgb) return BLACK_HEX
  const onWhite = contrastRatio(backgroundRgb, { r: 255, g: 255, b: 255 })
  return onWhite >= MIN_TEXT_CONTRAST || onWhite >= contrastRatio(backgroundRgb, { r: 0, g: 0, b: 0 }) ? WHITE_HEX : BLACK_HEX
}

export const isLightColor = (color: string): boolean => {
  const rgb = parseCssColor(color)
  return !!rgb && relativeLuminance(rgb) >= LIGHT_SURFACE_MIN_LUMINANCE
}
