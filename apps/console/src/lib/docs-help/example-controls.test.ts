import { SIMILARITY_THRESHOLD, existingRefCodePrefix, isWeakTitle, orgRefCodeFromTemplate, textSimilarity } from './example-controls'

describe('isWeakTitle', () => {
  it('treats an empty or stub title as weak', () => {
    expect(isWeakTitle('', 'A1.1')).toBe(true)
    expect(isWeakTitle('  ', 'A1.1')).toBe(true)
  })

  it('treats a title that only repeats the ref code as weak', () => {
    expect(isWeakTitle('A1.1', 'a1.1')).toBe(true)
  })

  it('accepts a real title', () => {
    expect(isWeakTitle('Forecast Processing Demand', 'A1.1')).toBe(false)
  })
})

describe('textSimilarity', () => {
  it('matches the same requirement written in different voices', () => {
    const org = 'Openlane forecasts and compares it to scheduled capacity on an annual basis.'
    const docs = 'Future processing demand is forecasted and compared to scheduled capacity on an annual basis.'
    expect(textSimilarity(org, docs)).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
  })

  it('keeps distinct controls apart', () => {
    expect(textSimilarity('Access control reviews happen quarterly', 'Change control approvals happen quarterly')).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('is zero when either side has no significant words', () => {
    expect(textSimilarity('', 'anything at all')).toBe(0)
    expect(textSimilarity('a an the', 'anything at all')).toBe(0)
  })

  it('ignores html markup', () => {
    expect(textSimilarity('<p>quarterly access reviews</p>', 'quarterly access reviews')).toBe(1)
  })
})

describe('orgRefCodeFromTemplate', () => {
  it('swaps the OL prefix for the org abbreviation', () => {
    expect(orgRefCodeFromTemplate('OL-12.06', 'Acme Corp')).toBe('AC-12.06')
  })

  it('handles a single word org name', () => {
    expect(orgRefCodeFromTemplate('OL-01.01', 'Microsoft')).toBe('MI-01.01')
  })

  it('keeps the OL prefix when the name gives nothing to abbreviate', () => {
    expect(orgRefCodeFromTemplate('OL-12.06', '')).toBe('OL-12.06')
    expect(orgRefCodeFromTemplate('OL-12.06', undefined)).toBe('OL-12.06')
  })

  it('leaves a ref code that is not an OL template alone', () => {
    expect(orgRefCodeFromTemplate('CC6.1', 'Acme Corp')).toBe('CC6.1')
  })
})

describe('existingRefCodePrefix', () => {
  it('reads the prefix the org already uses', () => {
    expect(existingRefCodePrefix(['MS-01.01', 'MS-02.03'])).toBe('MS')
  })

  it('takes the most common prefix, not a stray one', () => {
    expect(existingRefCodePrefix(['MS-01.01', 'MS-02.03', 'XX-09.01'])).toBe('MS')
  })

  it('ignores ref codes without a prefix', () => {
    expect(existingRefCodePrefix(['CC6.1', 'A1.1'])).toBe('')
    expect(existingRefCodePrefix([])).toBe('')
  })
})

describe('orgRefCodeFromTemplate with existing controls', () => {
  it('prefers the prefix already in use over the name abbreviation', () => {
    expect(orgRefCodeFromTemplate('OL-12.06', 'Microsoft', ['MS-01.01', 'MS-02.03'])).toBe('MS-12.06')
  })

  it('falls back to the name when no existing prefix is found', () => {
    expect(orgRefCodeFromTemplate('OL-12.06', 'Microsoft', ['CC6.1'])).toBe('MI-12.06')
  })
})
