import { readFileSync } from 'node:fs'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { EvidenceStatusColors, getEvidenceStatusStyle } from './evidence-enum'

const uiStyles = readFileSync(new URL('../../../../../../packages/ui/src/styles.css', import.meta.url), 'utf8')

describe('EvidenceStatusColors', () => {
  test('maps every evidence status to a design token defined in the ui theme', () => {
    for (const status of Object.values(EvidenceEvidenceStatus)) {
      const token = EvidenceStatusColors[status]
      expect(token).toMatch(/^var\(--color-evidence-[a-z-]+\)$/)
      expect(uiStyles).toContain(`${token.slice(4, -1)}:`)
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
