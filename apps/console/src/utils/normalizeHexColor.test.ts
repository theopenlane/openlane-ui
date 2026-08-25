import { normalizeHexColor } from './normalizeHexColor'

/**
 * ISS-2542 — trust center branding requires a real hex colour. normalizeHexColor
 * is the gate: it accepts what a user might reasonably paste (with or without a
 * leading #, 3- or 6-digit, any case, padded) and returns a single canonical
 * lowercase 6-digit form, or null so the caller can reject the input.
 */
describe('normalizeHexColor', () => {
  test('canonicalises a 6-digit value to lowercase with a single #', () => {
    expect(normalizeHexColor('#AABBCC')).toBe('#aabbcc')
    expect(normalizeHexColor('aabbcc')).toBe('#aabbcc')
  })

  test('expands a 3-digit shorthand', () => {
    expect(normalizeHexColor('#abc')).toBe('#aabbcc')
    expect(normalizeHexColor('ABC')).toBe('#aabbcc')
  })

  test('tolerates surrounding whitespace', () => {
    expect(normalizeHexColor('  #abc  ')).toBe('#aabbcc')
  })

  test('collapses repeated leading hashes', () => {
    // Pasting from some pickers yields "##aabbcc".
    expect(normalizeHexColor('##aabbcc')).toBe('#aabbcc')
  })

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['a 4-digit value', '#abcd'],
    ['a 5-digit value', '#abcde'],
    ['an 8-digit value with alpha', '#aabbccdd'],
    ['a non-hex letter', '#gggggg'],
    ['a named colour', 'rebeccapurple'],
    ['an rgb function', 'rgb(0,0,0)'],
    ['an inner hash', '#aab#cc'],
  ])('returns null for %s', (_label, input) => {
    expect(normalizeHexColor(input)).toBeNull()
  })

  test('is idempotent', () => {
    const once = normalizeHexColor('#ABC')
    expect(normalizeHexColor(once)).toBe(once)
  })
})
