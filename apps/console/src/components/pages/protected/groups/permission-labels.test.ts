import { Permission } from '@repo/codegen/src/schema'
import { PERMISSION_LABELS } from './permission-labels'

describe('PERMISSION_LABELS', () => {
  it('labels every Permission the schema declares', () => {
    expect(Object.keys(PERMISSION_LABELS).sort()).toEqual(Object.values(Permission).sort())
  })

  it('gives each permission a distinct, non-empty label', () => {
    const labels = Object.values(PERMISSION_LABELS)
    expect(labels.every((label) => label.trim().length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('maps the schema values to the wording the export and table share', () => {
    expect(PERMISSION_LABELS[Permission.VIEWER]).toBe('View')
    expect(PERMISSION_LABELS[Permission.EDITOR]).toBe('Edit')
    expect(PERMISSION_LABELS[Permission.CREATOR]).toBe('Create')
    expect(PERMISSION_LABELS[Permission.BLOCKED]).toBe('Blocked')
  })
})
