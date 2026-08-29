import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { EvidenceStatusColors, getEvidenceStatusLabel, getEvidenceStatusStyle } from './evidence-enum'

/**
 * ISS-2594 — two statuses are abbreviated so they fit the chart legend; everything else falls
 * through to getEnumLabel. The colour map has to stay exhaustive or a chip renders transparent.
 */
describe('EvidenceStatusColors', () => {
  test('covers every evidence status', () => {
    for (const status of Object.values(EvidenceEvidenceStatus)) {
      expect(EvidenceStatusColors[status]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('getEvidenceStatusLabel', () => {
  test('shortens the two long statuses for the chart legend', () => {
    expect(getEvidenceStatusLabel(EvidenceEvidenceStatus.AUDITOR_APPROVED)).toBe('Approved')
    expect(getEvidenceStatusLabel(EvidenceEvidenceStatus.READY_FOR_AUDITOR)).toBe('Ready')
  })

  test('falls back to the standard enum label for the rest', () => {
    // getEnumLabel title-cases every word, so ALL_CAPS becomes "Missing Artifact".
    expect(getEvidenceStatusLabel(EvidenceEvidenceStatus.MISSING_ARTIFACT)).toBe('Missing Artifact')
    expect(getEvidenceStatusLabel(EvidenceEvidenceStatus.IN_REVIEW)).toBe('In Review')
  })

  test('never returns a raw ALL_CAPS value', () => {
    for (const status of Object.values(EvidenceEvidenceStatus)) {
      expect(getEvidenceStatusLabel(status)).not.toBe(status)
    }
  })
})

describe('getEvidenceStatusStyle', () => {
  test('pairs a solid text colour with a translucent background of the same hue', () => {
    const style = getEvidenceStatusStyle(EvidenceEvidenceStatus.REJECTED)

    expect(style.color).toBe(EvidenceStatusColors[EvidenceEvidenceStatus.REJECTED])
    expect(style.bg).toContain(EvidenceStatusColors[EvidenceEvidenceStatus.REJECTED])
    expect(style.bg).toContain('color-mix')
  })

  test('resolves for every status without producing undefined', () => {
    for (const status of Object.values(EvidenceEvidenceStatus)) {
      const style = getEvidenceStatusStyle(status)
      expect(style.color).toBeDefined()
      expect(style.bg).not.toContain('undefined')
    }
  })
})
