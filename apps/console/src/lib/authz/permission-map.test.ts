import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { deriveOrgMember, IRREGULAR_PERMISSIONS } from './permission-map'

const ACCESS_VALUES = new Set<string>(Object.values(AccessEnum))

// Object types the console exposes a create action for. Each must resolve to a real
// can_create_<object> relation; if the backend FGA model drops one, deriveOrgMember returns
// undefined here and this test fails — surfacing the coverage regression instead of a silently
// dead gate.
const CREATE_SURFACES: ObjectTypes[] = [
  ObjectTypes.GROUP,
  ObjectTypes.CONTROL,
  ObjectTypes.PROGRAM,
  ObjectTypes.RISK,
  ObjectTypes.PROCEDURE,
  ObjectTypes.INTERNAL_POLICY,
  ObjectTypes.EVIDENCE,
  ObjectTypes.CONTROL_OBJECTIVE,
  ObjectTypes.CONTROL_IMPLEMENTATION,
  ObjectTypes.SUBCONTROL,
  ObjectTypes.TEMPLATE,
  ObjectTypes.MAPPED_CONTROL,
  ObjectTypes.STANDARD,
  ObjectTypes.NARRATIVE,
  ObjectTypes.ASSET,
  ObjectTypes.ENTITY,
  ObjectTypes.CONTACT,
  ObjectTypes.SCAN,
]

describe('permission map', () => {
  it('maps every irregular action to a relation the backend model still defines', () => {
    Object.values(IRREGULAR_PERMISSIONS).forEach((member) => {
      expect(ACCESS_VALUES.has(member)).toBe(true)
    })
  })

  CREATE_SURFACES.forEach((objectType) => {
    it(`derives a create permission for ${objectType}`, () => {
      expect(deriveOrgMember(objectType, 'create')).toBeDefined()
    })
  })
})
