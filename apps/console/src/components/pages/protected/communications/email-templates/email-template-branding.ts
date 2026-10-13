import { findSchemaDefinition, type RJSFSchema } from '@rjsf/utils'
import type { ScanBranding } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { isLightColor, meetsContrast, MIN_LARGE_TEXT_CONTRAST, MIN_TEXT_CONTRAST, readableTextColor, WHITE_HEX } from '@/utils/color-contrast'
import { toHumanLabel } from '@/utils/strings'

export type TEmailBrandingSuggestion = {
  field: string
  label: string
  value: string
  kind: 'color' | 'image'
  source: string
  selected: boolean
}

export type TEmailBrandingReview = {
  domain: string
  isDarkPalette: boolean
  suggestions: TEmailBrandingSuggestion[]
}

type TCandidate = Omit<TEmailBrandingSuggestion, 'label'>
type TPicked = { value: string; source: string }

const pickColor = (...options: Array<[source: string, color: string | undefined]>): TPicked | undefined =>
  options.map(([source, color]) => ({ source, value: normalizeHexColor(color) })).find((picked): picked is TPicked => !!picked.value)

const colorCandidate = (field: string, picked: TPicked | undefined, isSelected: (value: string) => boolean): TCandidate | null =>
  picked ? { field, kind: 'color', ...picked, selected: isSelected(picked.value) } : null

const EMAIL_UNSAFE_IMAGE = /\.(svg|webp)(?:[?#]|$)/i

const imageCandidates = (url: string | undefined): TCandidate[] => {
  if (!url) return []
  const isEmailSafe = !EMAIL_UNSAFE_IMAGE.test(url)
  const source = isEmailSafe ? 'Logo' : 'Logo (SVG and WebP images do not show in many email clients)'
  return [
    { field: 'headerLogoURL', value: url, kind: 'image', source, selected: isEmailSafe },
    { field: 'logoURL', value: url, kind: 'image', source, selected: false },
  ]
}

const buildCandidates = (branding: ScanBranding): { candidates: TCandidate[]; isDarkPalette: boolean } => {
  const card = pickColor(['Background color', branding.background_color])
  const button = pickColor(['Accent color', branding.accent_color], ['Primary color', branding.primary_color])

  const pageBackground = card?.value ?? WHITE_HEX
  const isLightPalette = isLightColor(pageBackground)
  const emailCard = isLightPalette ? pageBackground : WHITE_HEX
  const body = pickColor(['Secondary background color', branding.secondary_background_color], ['Background color', branding.background_color])
  const hero = pickColor(['Secondary background color', branding.secondary_background_color])
  const isAppliedSurface = (surface: TPicked | undefined): surface is TPicked => isLightPalette && !!surface && isLightColor(surface.value)
  const textSurfaces = [emailCard, ...(isAppliedSurface(hero) ? [hero.value] : [])]
  const footerSurfaces = [emailCard, ...(isAppliedSurface(body) ? [body.value] : [])]
  const readableOn = (surfaces: string[], minimum: number) => (value: string) => surfaces.every((surface) => meetsContrast(value, surface, minimum))

  const candidates = [
    colorCandidate('primaryColor', pickColor(['Primary color', branding.primary_color]), readableOn(textSurfaces, MIN_LARGE_TEXT_CONTRAST)),
    colorCandidate('buttonColor', button, () => true),
    colorCandidate('buttonTextColor', button && { value: readableTextColor(button.value), source: 'Readable on the button color' }, () => true),
    colorCandidate('cardBackgroundColor', card, () => isLightPalette),
    colorCandidate('bodyBackgroundColor', body, () => isAppliedSurface(body)),
    colorCandidate('heroBackgroundColor', hero, () => isAppliedSurface(hero)),
    colorCandidate('textColor', pickColor(['Text color', branding.foreground_color]), (value) => isLightPalette && readableOn(textSurfaces, MIN_TEXT_CONTRAST)(value)),
    colorCandidate(
      'footerTextColor',
      pickColor(['Secondary text color', branding.secondary_foreground_color], ['Text color', branding.foreground_color]),
      (value) => isLightPalette && readableOn(footerSurfaces, MIN_TEXT_CONTRAST)(value),
    ),
    ...imageCandidates(branding.logo_url),
  ]

  return { candidates: candidates.filter((candidate): candidate is TCandidate => !!candidate), isDarkPalette: !isLightPalette }
}

export const buildEmailBrandingReview = (branding: ScanBranding, domain: string, schema: RJSFSchema): TEmailBrandingReview => {
  const properties = (schema.$ref ? findSchemaDefinition(schema.$ref, schema) : schema).properties ?? {}
  const { candidates, isDarkPalette } = buildCandidates(branding)

  const suggestions = candidates
    .filter((candidate) => Object.hasOwn(properties, candidate.field))
    .map((candidate) => {
      const property = properties[candidate.field]
      const title = typeof property === 'object' ? property.title : undefined
      return { ...candidate, label: title || toHumanLabel(candidate.field) }
    })

  return { domain, isDarkPalette, suggestions }
}

export const applyEmailBranding = (config: Record<string, unknown>, suggestions: TEmailBrandingSuggestion[]): Record<string, unknown> => ({
  ...config,
  ...Object.fromEntries(suggestions.filter((suggestion) => suggestion.selected).map((suggestion) => [suggestion.field, suggestion.value])),
})
