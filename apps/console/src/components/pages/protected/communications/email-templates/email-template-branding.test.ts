import type { RJSFSchema } from '@rjsf/utils'
import type { ScanBranding } from '@/components/pages/protected/scans/detail/openlane-domain-scan/scan-metadata'
import { applyEmailBranding, buildEmailBrandingReview, type TEmailBrandingReview } from './email-template-branding'

const FIELDS = ['primaryColor', 'buttonColor', 'buttonTextColor', 'cardBackgroundColor', 'bodyBackgroundColor', 'heroBackgroundColor', 'textColor', 'footerTextColor', 'headerLogoURL', 'logoURL']

const SCHEMA: RJSFSchema = {
  $ref: '#/$defs/BrandedMessageRequest',
  $defs: {
    BrandedMessageRequest: {
      type: 'object',
      properties: Object.fromEntries(FIELDS.map((field) => [field, { type: 'string' }])),
    },
  },
}

const LIGHT_BRANDING: ScanBranding = {
  primary_color: '#0055ff',
  accent_color: '#ff5500',
  background_color: '#ffffff',
  secondary_background_color: '#f5f5f5',
  foreground_color: '#1a1a1a',
  secondary_foreground_color: '#555555',
  logo_url: 'https://example.com/logo.png',
}

const DARK_BRANDING: ScanBranding = {
  primary_color: '#05f7fe',
  accent_color: '#05f7fe',
  background_color: '#0a0d17',
  secondary_background_color: '#0d1222',
  foreground_color: '#ffffff',
  secondary_foreground_color: '#cccccc',
}

const selection = (review: TEmailBrandingReview) => Object.fromEntries(review.suggestions.map((suggestion) => [suggestion.field, suggestion.selected]))
const valueOf = (review: TEmailBrandingReview, field: string) => review.suggestions.find((suggestion) => suggestion.field === field)?.value

describe('buildEmailBrandingReview', () => {
  test('a light palette pre-selects every surface and readable text color', () => {
    const review = buildEmailBrandingReview(LIGHT_BRANDING, 'example.com', SCHEMA)

    expect(review.isDarkPalette).toBe(false)
    expect(selection(review)).toEqual({
      primaryColor: true,
      buttonColor: true,
      buttonTextColor: true,
      cardBackgroundColor: true,
      bodyBackgroundColor: true,
      heroBackgroundColor: true,
      textColor: true,
      footerTextColor: true,
      headerLogoURL: true,
      logoURL: false,
    })
    expect(valueOf(review, 'buttonColor')).toBe('#ff5500')
    expect(valueOf(review, 'buttonTextColor')).toBe('#000000')
  })

  test('a dark palette keeps the email on white and only pre-selects the button', () => {
    const review = buildEmailBrandingReview(DARK_BRANDING, 'example.com', SCHEMA)

    expect(review.isDarkPalette).toBe(true)
    expect(selection(review)).toEqual({
      primaryColor: false,
      buttonColor: true,
      buttonTextColor: true,
      cardBackgroundColor: false,
      bodyBackgroundColor: false,
      heroBackgroundColor: false,
      textColor: false,
      footerTextColor: false,
    })
    expect(valueOf(review, 'buttonTextColor')).toBe('#000000')
  })

  test('a dark palette still pre-selects a primary color and logo that work on the white email card', () => {
    const review = buildEmailBrandingReview({ ...DARK_BRANDING, primary_color: '#0055ff', logo_url: 'https://example.com/logo.png' }, 'example.com', SCHEMA)

    expect(review.isDarkPalette).toBe(true)
    expect(selection(review)).toMatchObject({ primaryColor: true, headerLogoURL: true, logoURL: false, cardBackgroundColor: false, textColor: false })
  })

  test('a transparent page background is treated as a white, light palette', () => {
    const review = buildEmailBrandingReview({ ...LIGHT_BRANDING, background_color: '' }, 'example.com', SCHEMA)

    expect(review.isDarkPalette).toBe(false)
    expect(valueOf(review, 'cardBackgroundColor')).toBeUndefined()
    expect(selection(review).textColor).toBe(true)
  })

  test('a light palette does not pre-select colors that are unreadable on the email surfaces', () => {
    const review = buildEmailBrandingReview({ ...LIGHT_BRANDING, primary_color: '#9af5dc', foreground_color: '#d0d0d0', secondary_foreground_color: '' }, 'example.com', SCHEMA)

    expect(review.isDarkPalette).toBe(false)
    expect(selection(review)).toMatchObject({ primaryColor: false, textColor: false, footerTextColor: false })
    expect(valueOf(review, 'footerTextColor')).toBe('#d0d0d0')
  })

  test('a dark secondary background on a light page is offered but not pre-selected', () => {
    const review = buildEmailBrandingReview({ ...LIGHT_BRANDING, secondary_background_color: '#111827' }, 'example.com', SCHEMA)

    expect(review.isDarkPalette).toBe(false)
    expect(selection(review)).toMatchObject({ bodyBackgroundColor: false, heroBackgroundColor: false, cardBackgroundColor: true })
  })

  test('an SVG or WebP logo is offered but never pre-selected', () => {
    const svg = buildEmailBrandingReview({ ...LIGHT_BRANDING, logo_url: 'https://example.com/logo.svg?v=2' }, 'example.com', SCHEMA)
    const webp = buildEmailBrandingReview({ ...LIGHT_BRANDING, logo_url: 'https://example.com/logo.webp' }, 'example.com', SCHEMA)

    expect(selection(svg)).toMatchObject({ headerLogoURL: false, logoURL: false })
    expect(selection(webp)).toMatchObject({ headerLogoURL: false, logoURL: false })
  })

  test('only fields the template schema declares are suggested, labelled from the schema title', () => {
    const schema: RJSFSchema = { type: 'object', properties: { buttonColor: { type: 'string', title: 'Call to action' } } }
    const review = buildEmailBrandingReview(LIGHT_BRANDING, 'example.com', schema)

    expect(review.suggestions.map((suggestion) => [suggestion.field, suggestion.label])).toEqual([['buttonColor', 'Call to action']])
  })

  test('colors are normalised to lowercase six-digit hex', () => {
    const review = buildEmailBrandingReview({ ...LIGHT_BRANDING, accent_color: '#F50' }, 'example.com', SCHEMA)

    expect(valueOf(review, 'buttonColor')).toBe('#ff5500')
  })
})

describe('applyEmailBranding', () => {
  test('writes only the selected suggestions over the existing config', () => {
    const review = buildEmailBrandingReview(DARK_BRANDING, 'example.com', SCHEMA)

    expect(applyEmailBranding({ textColor: '#333333', subject: 'Hi' }, review.suggestions)).toEqual({
      textColor: '#333333',
      subject: 'Hi',
      buttonColor: '#05f7fe',
      buttonTextColor: '#000000',
    })
  })
})
