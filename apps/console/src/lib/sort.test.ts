import { compareNatural } from './sort'

/**
 * compareNatural reuses one Intl.Collator instead of building one per comparison, which dominated the sort on
 * large control reports. Behaviour has to stay identical to the localeCompare call it replaced.
 */
describe('compareNatural', () => {
  const sorted = (values: string[]): string[] => [...values].sort(compareNatural)

  test('orders embedded numbers numerically, not lexically', () => {
    expect(sorted(['CC1.10', 'CC1.2', 'CC1.1'])).toEqual(['CC1.1', 'CC1.2', 'CC1.10'])
  })

  test('orders multi-segment ref codes correctly', () => {
    expect(sorted(['A.10.1', 'A.2.1', 'A.2.10', 'A.2.2'])).toEqual(['A.2.1', 'A.2.2', 'A.2.10', 'A.10.1'])
  })

  test('returns 0 for identical values', () => {
    expect(compareNatural('CC1.1', 'CC1.1')).toBe(0)
  })

  test('is antisymmetric', () => {
    expect(Math.sign(compareNatural('CC1.2', 'CC1.10'))).toBe(-Math.sign(compareNatural('CC1.10', 'CC1.2')))
  })

  test('sorts an empty string first', () => {
    expect(sorted(['CC1.1', ''])).toEqual(['', 'CC1.1'])
  })

  test('handles pure numbers', () => {
    expect(sorted(['10', '9', '100', '1'])).toEqual(['1', '9', '10', '100'])
  })

  test('handles values with no digits', () => {
    expect(sorted(['beta', 'alpha', 'gamma'])).toEqual(['alpha', 'beta', 'gamma'])
  })

  test('produces a stable total order over a mixed set', () => {
    const values = ['CC2.1', 'CC1.10', 'A.1', 'CC1.2', 'B.10', 'B.2']
    const once = sorted(values)

    expect(sorted(once)).toEqual(once)
  })
})
