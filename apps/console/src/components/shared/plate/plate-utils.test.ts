import { type Value } from 'platejs'
import { canonicalizeDetails, isPlateValueEmpty, trimPlateValue } from './plate-utils'

/**
 * ISS-2646 — trust center overview values were saved with leading and trailing
 * blank paragraphs, which the editor produces freely.
 *
 * The rules being pinned:
 *  - "empty" is a structural question, not a truthiness one. A Plate value is a
 *    non-null array of nodes with blank text, so `!!value` says nothing; this is
 *    what several callers rely on to hide a panel (#88) or skip a save.
 *  - a VOID node (an image, a divider) is content even with no text, so a value
 *    containing one is not empty.
 *  - trimPlateValue must not mutate its input — callers keep the original form
 *    state while saving the trimmed copy.
 */

const p = (text: string): Value[number] => ({ type: 'p', children: [{ text }] }) as Value[number]

describe('isPlateValueEmpty', () => {
  test('treats null, undefined and an empty string as empty', () => {
    expect(isPlateValueEmpty(null)).toBe(true)
    expect(isPlateValueEmpty(undefined)).toBe(true)
    expect(isPlateValueEmpty('')).toBe(true)
  })

  test('treats an empty node array as empty', () => {
    expect(isPlateValueEmpty([])).toBe(true)
  })

  test('treats a single blank paragraph as empty', () => {
    // The editor's default value — non-null, so a truthiness check would call
    // this content.
    expect(isPlateValueEmpty([p('')])).toBe(true)
  })

  test('treats whitespace-only text as empty', () => {
    expect(isPlateValueEmpty([p('   ')])).toBe(true)
    expect(isPlateValueEmpty([p('\n\t ')])).toBe(true)
  })

  test('treats several blank paragraphs as empty', () => {
    expect(isPlateValueEmpty([p(''), p('  '), p('')])).toBe(true)
  })

  test('treats any real text as non-empty', () => {
    expect(isPlateValueEmpty([p('hello')])).toBe(false)
    expect(isPlateValueEmpty([p(''), p('hello')])).toBe(false)
  })
})

describe('trimPlateValue', () => {
  test('returns an empty value unchanged', () => {
    expect(trimPlateValue([])).toEqual([])
  })

  test('drops leading and trailing blank paragraphs', () => {
    const trimmed = trimPlateValue([p(''), p('hello'), p('')])

    expect(trimmed).toHaveLength(1)
    expect(trimmed[0]).toMatchObject({ type: 'p' })
  })

  test('keeps blank paragraphs in the MIDDLE, which are deliberate spacing', () => {
    const trimmed = trimPlateValue([p(''), p('a'), p(''), p('b'), p('')])

    expect(trimmed).toHaveLength(3)
  })

  test('trims whitespace at the very start and end of the text', () => {
    const trimmed = trimPlateValue([p('  hello  ')])

    expect(JSON.stringify(trimmed)).toContain('hello')
    expect(JSON.stringify(trimmed)).not.toContain('  hello')
  })

  test('collapses an all-blank value to nothing', () => {
    expect(trimPlateValue([p(''), p('  ')])).toEqual([])
  })

  test('does not mutate the input value', () => {
    const original: Value = [p(''), p('  hello  '), p('')]
    const snapshot = JSON.stringify(original)

    trimPlateValue(original)

    expect(JSON.stringify(original)).toBe(snapshot)
  })

  test('leaves an already-trimmed value alone', () => {
    const value: Value = [p('hello')]

    expect(JSON.stringify(trimPlateValue(value))).toBe(JSON.stringify(value))
  })
})

describe('canonicalizeDetails', () => {
  test('produces the same string regardless of key order', () => {
    const a = [{ type: 'p', children: [{ text: 'hi' }] }] as Value
    const b = [{ children: [{ text: 'hi' }], type: 'p' }] as Value

    expect(canonicalizeDetails(a)).toBe(canonicalizeDetails(b))
  })

  test('distinguishes different content', () => {
    expect(canonicalizeDetails([p('a')] as Value)).not.toBe(canonicalizeDetails([p('b')] as Value))
  })
})
