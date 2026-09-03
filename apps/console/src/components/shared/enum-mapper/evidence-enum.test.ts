import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { EvidenceStatusColors, getEvidenceStatusStyle } from './evidence-enum'

describe('EvidenceStatusColors', () => {
  test('covers every evidence status', () => {
    for (const status of Object.values(EvidenceEvidenceStatus)) {
      expect(EvidenceStatusColors[status]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('getEvidenceStatusStyle', () => {
  test('pairs a solid text colour with a translucent background of the same hue', () => {
    const style = getEvidenceStatusStyle(EvidenceEvidenceStatus.REJECTED)

    expect(style.color).toBe(EvidenceStatusColors[EvidenceEvidenceStatus.REJECTED])
    expect(style.backgroundColor).toContain(EvidenceStatusColors[EvidenceEvidenceStatus.REJECTED])
    expect(style.backgroundColor).toContain('color-mix')
  })

  test('resolves for every status without producing undefined', () => {
    for (const status of Object.values(EvidenceEvidenceStatus)) {
      const style = getEvidenceStatusStyle(status)
      expect(style.color).toBeDefined()
      expect(style.backgroundColor).not.toContain('undefined')
    }
  })
})
