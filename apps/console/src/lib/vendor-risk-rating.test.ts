import { isVendorRiskRating, riskRatingFromScore, VendorRiskRating, VENDOR_RISK_RATING_OPTIONS } from './vendor-risk-rating'

/**
 * ISS-2749 — the thresholds are inclusive upper bounds, so every band boundary is an off-by-one
 * waiting to happen: 5 is LOW, 6 is MEDIUM. Absent input returns undefined rather than NONE,
 * which would claim an unscored vendor had been assessed as no-risk.
 */
describe('riskRatingFromScore — band boundaries', () => {
  test.each([
    [0, VendorRiskRating.NONE],
    [1, VendorRiskRating.VERY_LOW],
    [3, VendorRiskRating.VERY_LOW],
    [4, VendorRiskRating.LOW],
    [5, VendorRiskRating.LOW],
    [6, VendorRiskRating.MEDIUM],
    [11, VendorRiskRating.MEDIUM],
    [12, VendorRiskRating.HIGH],
    [15, VendorRiskRating.HIGH],
    [16, VendorRiskRating.CRITICAL],
    [100, VendorRiskRating.CRITICAL],
  ])('scores %i as %s', (score, expected) => {
    expect(riskRatingFromScore(score)).toBe(expected)
  })

  test('treats a negative score as NONE rather than falling through', () => {
    expect(riskRatingFromScore(-1)).toBe(VendorRiskRating.NONE)
  })

  test('accepts a numeric string', () => {
    expect(riskRatingFromScore('12')).toBe(VendorRiskRating.HIGH)
  })
})

describe('riskRatingFromScore — absent or invalid input', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['a non-numeric string', 'high'],
  ])('returns undefined for %s', (_label, value) => {
    // Deliberately NOT NONE — an unscored vendor must not read as assessed.
    expect(riskRatingFromScore(value)).toBeUndefined()
  })

  test('distinguishes an unscored vendor from one scored zero', () => {
    expect(riskRatingFromScore(null)).toBeUndefined()
    expect(riskRatingFromScore(0)).toBe(VendorRiskRating.NONE)
  })
})

describe('isVendorRiskRating', () => {
  test('accepts every defined rating', () => {
    for (const rating of Object.values(VendorRiskRating)) {
      expect(isVendorRiskRating(rating)).toBe(true)
    }
  })

  test('rejects unknown values', () => {
    expect(isVendorRiskRating('EXTREME')).toBe(false)
    expect(isVendorRiskRating('')).toBe(false)
    expect(isVendorRiskRating('high')).toBe(false)
  })
})

describe('VENDOR_RISK_RATING_OPTIONS', () => {
  test('offers one option per rating', () => {
    expect(VENDOR_RISK_RATING_OPTIONS).toHaveLength(Object.keys(VendorRiskRating).length)
  })

  test('labels are humanised, not raw enum values', () => {
    const veryLow = VENDOR_RISK_RATING_OPTIONS.find((option) => option.value === VendorRiskRating.VERY_LOW)

    expect(veryLow?.label).not.toBe('VERY_LOW')
  })
})
