import { SIMILARITY_THRESHOLD, isWeakTitle, parseExampleControls, textSimilarity } from './example-controls'

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

describe('parseExampleControls', () => {
  const section = ['* **A1.1.1** - Capacity is monitored continuously', '* **A1.1.2** - Systems are reviewed annually', 'not a bullet'].join('\n')

  it('reads ref code and description from doc bullets', () => {
    expect(parseExampleControls(section)).toEqual([
      { refCode: 'A1.1.1', title: '', description: 'Capacity is monitored continuously' },
      { refCode: 'A1.1.2', title: '', description: 'Systems are reviewed annually' },
    ])
  })

  it('drops suggestions the org already has, case insensitively', () => {
    expect(parseExampleControls(section, ['a1.1.1']).map((row) => row.refCode)).toEqual(['A1.1.2'])
  })

  it('strips inline markdown from the bullet', () => {
    const linked = '* **[A2.1](https://example.com)** - Backups are **tested** quarterly'
    expect(parseExampleControls(linked)).toEqual([{ refCode: 'A2.1', title: '', description: 'Backups are tested quarterly' }])
  })

  it('returns nothing for a section with no bullets', () => {
    expect(parseExampleControls('No examples here.')).toEqual([])
  })
})
