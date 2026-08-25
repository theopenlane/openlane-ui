import { resolveAllowedStatuses } from './allowed-statuses'
import { type StatusFilterableWhere } from './has-status-condition'

/**
 * ISS-2715 — the tasks card/board view renders one column per status, but only
 * for statuses the current filter can actually match. resolveAllowedStatuses
 * works that out by intersecting the filter against the full status list.
 *
 * Getting it wrong is visible either way: too narrow and a column with tasks in
 * it disappears; too wide and the board fills with permanently-empty columns.
 *
 * The and/or handling is the subtle part — `and` narrows cumulatively while `or`
 * keeps the union of what its branches allow.
 */

type Status = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'WONT_DO'

const ALL: readonly Status[] = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'WONT_DO']

const where = (value: StatusFilterableWhere): StatusFilterableWhere => value

describe('resolveAllowedStatuses', () => {
  test('allows every status when there is no filter', () => {
    expect(resolveAllowedStatuses(null, ALL)).toEqual([...ALL])
    expect(resolveAllowedStatuses(undefined, ALL)).toEqual([...ALL])
  })

  test('allows every status for an empty filter', () => {
    expect(resolveAllowedStatuses(where({}), ALL)).toEqual([...ALL])
  })

  test('narrows to a single status', () => {
    expect(resolveAllowedStatuses(where({ status: 'OPEN' }), ALL)).toEqual(['OPEN'])
  })

  test('narrows to a statusIn list', () => {
    expect(resolveAllowedStatuses(where({ statusIn: ['OPEN', 'IN_REVIEW'] }), ALL)).toEqual(['OPEN', 'IN_REVIEW'])
  })

  test('excludes a statusNEQ', () => {
    expect(resolveAllowedStatuses(where({ statusNEQ: 'COMPLETED' }), ALL)).not.toContain('COMPLETED')
  })

  test('excludes a statusNotIn list', () => {
    const allowed = resolveAllowedStatuses(where({ statusNotIn: ['COMPLETED', 'WONT_DO'] }), ALL)

    expect(allowed).toEqual(['OPEN', 'IN_PROGRESS', 'IN_REVIEW'])
  })

  test('treats an empty statusIn as no constraint', () => {
    // An empty array means "nothing selected", not "match nothing" — otherwise
    // clearing a filter would blank the board.
    expect(resolveAllowedStatuses(where({ statusIn: [] }), ALL)).toEqual([...ALL])
  })

  test('combines several top-level constraints', () => {
    const allowed = resolveAllowedStatuses(where({ statusIn: ['OPEN', 'IN_PROGRESS', 'COMPLETED'], statusNEQ: 'COMPLETED' }), ALL)

    expect(allowed).toEqual(['OPEN', 'IN_PROGRESS'])
  })

  test('narrows cumulatively through an and-group', () => {
    const allowed = resolveAllowedStatuses(where({ and: [{ statusIn: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] }, { statusNotIn: ['IN_REVIEW'] }] }), ALL)

    expect(allowed).toEqual(['OPEN', 'IN_PROGRESS'])
  })

  test('keeps the union of an or-group', () => {
    const allowed = resolveAllowedStatuses(where({ or: [{ status: 'OPEN' }, { status: 'COMPLETED' }] }), ALL)

    expect(new Set(allowed)).toEqual(new Set(['OPEN', 'COMPLETED']))
  })

  test('applies a top-level constraint before an or-group', () => {
    const allowed = resolveAllowedStatuses(where({ statusNotIn: ['COMPLETED'], or: [{ status: 'OPEN' }, { status: 'COMPLETED' }] }), ALL)

    expect(allowed).toEqual(['OPEN'])
  })

  test('can resolve to nothing when the filter is contradictory', () => {
    expect(resolveAllowedStatuses(where({ status: 'OPEN', statusNEQ: 'OPEN' }), ALL)).toEqual([])
  })

  test('handles nesting several levels deep', () => {
    const allowed = resolveAllowedStatuses(where({ and: [{ or: [{ statusIn: ['OPEN', 'IN_PROGRESS'] }] }, { statusNEQ: 'IN_PROGRESS' }] }), ALL)

    expect(allowed).toEqual(['OPEN'])
  })

  test('preserves the order of the supplied status list', () => {
    expect(resolveAllowedStatuses(where({ statusIn: ['WONT_DO', 'OPEN'] }), ALL)).toEqual(['OPEN', 'WONT_DO'])
  })
})
