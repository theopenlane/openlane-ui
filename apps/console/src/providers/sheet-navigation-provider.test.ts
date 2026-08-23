import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { FULL_PAGE_KINDS, isSheetKind } from './sheet-navigation-provider'

/**
 * ISS-2593 — association links open their target's slideout IN PLACE instead of
 * navigating away, but only for object kinds that actually have a sheet.
 * isSheetKind is the switch; FULL_PAGE_KINDS names the kinds that must still
 * navigate (controls and subcontrols have full detail pages, not sheets).
 *
 * Getting this wrong is silent in one direction: a kind wrongly listed as a
 * sheet kind renders a link that opens nothing.
 */
describe('isSheetKind', () => {
  test.each([
    ObjectAssociationNodeEnum.POLICY,
    ObjectAssociationNodeEnum.PROCEDURE,
    ObjectAssociationNodeEnum.TASK,
    ObjectAssociationNodeEnum.EVIDENCE,
    ObjectAssociationNodeEnum.RISKS,
    ObjectAssociationNodeEnum.ASSET,
    ObjectAssociationNodeEnum.ENTITY,
  ])('is true for %s, which has a slideout', (kind) => {
    expect(isSheetKind(kind)).toBe(true)
  })

  test('is false for kinds that have a full detail page instead', () => {
    expect(isSheetKind(ObjectAssociationNodeEnum.CONTROL)).toBe(false)
    expect(isSheetKind(ObjectAssociationNodeEnum.SUBCONTROL)).toBe(false)
  })

  test('is false for an unknown kind', () => {
    expect(isSheetKind('not-a-kind')).toBe(false)
    expect(isSheetKind('')).toBe(false)
  })
})

describe('FULL_PAGE_KINDS', () => {
  test('holds controls and subcontrols', () => {
    expect(FULL_PAGE_KINDS.has(ObjectAssociationNodeEnum.CONTROL)).toBe(true)
    expect(FULL_PAGE_KINDS.has(ObjectAssociationNodeEnum.SUBCONTROL)).toBe(true)
  })

  test('never overlaps the sheet kinds', () => {
    // A kind in both sets would both navigate and try to open a sheet.
    for (const kind of FULL_PAGE_KINDS) {
      expect(isSheetKind(kind)).toBe(false)
    }
  })
})
