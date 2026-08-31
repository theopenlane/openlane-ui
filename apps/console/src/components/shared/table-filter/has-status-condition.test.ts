import { hasStatusCondition, type StatusFilterableWhere } from './has-status-condition'

/**
 * Linked-controls tables default to hiding archived, but must back off the moment the user filters by status
 * themselves. The check is key-presence rather than truthiness, and has to look inside nested and/or groups.
 */
describe('hasStatusCondition', () => {
  test('is false for an empty filter', () => {
    expect(hasStatusCondition({})).toBe(false)
  })

  test('is false for unrelated top-level keys', () => {
    expect(hasStatusCondition({ and: [] } as StatusFilterableWhere)).toBe(false)
  })

  test.each(['status', 'statusNEQ', 'statusIn', 'statusNotIn'])('detects a top-level %s condition', (key) => {
    expect(hasStatusCondition({ [key]: 'APPROVED' } as StatusFilterableWhere)).toBe(true)
  })

  test('treats an explicitly null/empty status key as a user-set condition', () => {
    // Key presence, not value — clearing a status filter in the UI leaves the key behind, and re-applying the
    // default would fight the user.
    expect(hasStatusCondition({ status: null })).toBe(true)
    expect(hasStatusCondition({ statusIn: [] })).toBe(true)
  })

  test('finds a status condition nested in an and-group', () => {
    expect(hasStatusCondition({ and: [{ statusIn: ['APPROVED'] }] })).toBe(true)
  })

  test('finds a status condition nested in an or-group', () => {
    expect(hasStatusCondition({ or: [{ statusNEQ: 'ARCHIVED' }] })).toBe(true)
  })

  test('recurses through several levels of nesting', () => {
    expect(hasStatusCondition({ and: [{ or: [{ and: [{ status: 'PREPARING' }] }] }] })).toBe(true)
  })

  test('is false when nested groups hold only non-status conditions', () => {
    expect(hasStatusCondition({ and: [{ or: [{}] }, {}] })).toBe(false)
  })

  test('tolerates null and/or groups', () => {
    expect(hasStatusCondition({ and: null, or: null })).toBe(false)
  })

  test('is true when only one branch of a mixed group constrains status', () => {
    expect(hasStatusCondition({ or: [{}, { statusIn: ['ARCHIVED'] }] })).toBe(true)
  })
})
