import { parseBrandingString } from './brandingString'

/**
 * #2092 — trust center branding can be imported from a pasted "branding string".
 * parseBrandingString is a parser for untrusted user input, so its refusals
 * matter more than its happy path: a wrong version prefix, a missing colour, or
 * an oversized payload must all yield null rather than a half-applied palette.
 *
 * Colours are normalised through normalizeHexColor (tested separately), so
 * shorthand and casing are accepted here too.
 */

const VALID = 'olbrand1:bg=#ffffff;fg=#000000;accent=#ff0000;secBg=#eeeeee;secFg=#333333'

describe('parseBrandingString', () => {
  test('parses a complete string into all five colours', () => {
    expect(parseBrandingString(VALID)).toEqual({
      backgroundColor: '#ffffff',
      foregroundColor: '#000000',
      accentColor: '#ff0000',
      secondaryBackgroundColor: '#eeeeee',
      secondaryForegroundColor: '#333333',
    })
  })

  test('normalises shorthand and uppercase colours', () => {
    const parsed = parseBrandingString('olbrand1:bg=#FFF;fg=000;accent=#Ff0000;secBg=#eee;secFg=#333')

    expect(parsed?.backgroundColor).toBe('#ffffff')
    expect(parsed?.foregroundColor).toBe('#000000')
    expect(parsed?.accentColor).toBe('#ff0000')
  })

  test('tolerates surrounding whitespace and spaced keys', () => {
    expect(parseBrandingString(`  ${VALID}  `)).not.toBeNull()
  })

  test('ignores pair order', () => {
    const reordered = 'olbrand1:secFg=#333333;accent=#ff0000;fg=#000000;secBg=#eeeeee;bg=#ffffff'

    expect(parseBrandingString(reordered)).toEqual(parseBrandingString(VALID))
  })

  test.each([
    ['an empty string', ''],
    ['no version separator', 'bg=#ffffff;fg=#000000'],
    ['an unknown version', 'olbrand2:bg=#ffffff;fg=#000000;accent=#ff0000;secBg=#eeeeee;secFg=#333333'],
  ])('returns null for %s', (_label, input) => {
    expect(parseBrandingString(input)).toBeNull()
  })

  test.each(['bg', 'fg', 'accent', 'secBg', 'secFg'])('returns null when the %s colour is missing', (key) => {
    const withoutKey = VALID.split(';')
      .filter((pair) => !pair.startsWith(`${key}=`) && !pair.startsWith(`olbrand1:${key}=`))
      .join(';')

    expect(parseBrandingString(withoutKey)).toBeNull()
  })

  test('returns null when any colour is not a valid hex', () => {
    expect(parseBrandingString(VALID.replace('#ff0000', 'rebeccapurple'))).toBeNull()
  })

  test('rejects an oversized payload without parsing it', () => {
    // Guards against a pasted blob being walked pair by pair.
    const huge = `${VALID};${'x'.repeat(600)}`

    expect(parseBrandingString(huge)).toBeNull()
  })

  test('ignores unknown extra keys as long as the five required ones are present', () => {
    expect(parseBrandingString(`${VALID};somethingElse=#123456`)).toEqual(parseBrandingString(VALID))
  })
})
