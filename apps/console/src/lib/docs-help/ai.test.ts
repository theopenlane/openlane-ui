import { dropRunawaySentences } from './ai'

describe('dropRunawaySentences', () => {
  it('leaves a draft within the cap untouched', () => {
    const text = 'The organization encrypts data at rest. Keys are rotated on a schedule.'
    expect(dropRunawaySentences(text, 200)).toBe(text)
  })

  it('leaves a draft exactly at the cap untouched', () => {
    const text = 'Data is encrypted.'
    expect(dropRunawaySentences(text, text.length)).toBe(text)
  })

  it('cuts a runaway draft back to the last whole sentence', () => {
    const text = 'One sentence here. Two sentence here. Three sentence here. Four sentence here.'
    expect(dropRunawaySentences(text, 45)).toBe('One sentence here. Two sentence here.')
  })

  it('keeps sentences ending in other terminators', () => {
    const text = 'Is access reviewed? Yes, quarterly. And logged for audit purposes afterwards.'
    expect(dropRunawaySentences(text, 40)).toBe('Is access reviewed? Yes, quarterly.')
  })

  it('returns the draft whole rather than cutting mid-sentence', () => {
    const text = 'The organization regularly tests its system recovery procedures to ensure they are effective'
    expect(dropRunawaySentences(text, 40)).toBe(text)
  })

  it('handles an empty draft', () => {
    expect(dropRunawaySentences('', 100)).toBe('')
  })
})
