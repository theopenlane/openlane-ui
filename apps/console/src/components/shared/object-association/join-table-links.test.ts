import { splitJoinTableInput } from './join-table-links'

/**
 * #2054 — finding↔control links live in a join table (findingControl), so they
 * cannot ride along in the entity's own update input. splitJoinTableInput peels
 * the join-table keys out of a mutation input and returns them as an add/remove
 * diff to be applied separately.
 *
 * Two rules carry the weight:
 *  - the bare key and its `add…` variant both mean "add" (callers use either)
 *  - add wins over remove for the same id, so a re-link in the same edit cannot
 *    be undone by a stale removal
 */
describe('splitJoinTableInput', () => {
  test('leaves an input with no join keys untouched', () => {
    const { entityInput, links } = splitJoinTableInput({ refCode: 'CC1.1', status: 'APPROVED' }, 'findingIDs')

    expect(entityInput).toEqual({ refCode: 'CC1.1', status: 'APPROVED' })
    expect(links).toEqual({ add: [], remove: [] })
  })

  test('treats the bare key as an add', () => {
    const { entityInput, links } = splitJoinTableInput({ findingIDs: ['f-1'] }, 'findingIDs')

    expect(entityInput).toEqual({})
    expect(links.add).toEqual(['f-1'])
  })

  test('treats the add-prefixed key as an add', () => {
    const { links } = splitJoinTableInput({ addFindingIDs: ['f-1', 'f-2'] }, 'findingIDs')

    expect(links.add).toEqual(['f-1', 'f-2'])
  })

  test('merges the bare and add-prefixed keys', () => {
    const { links } = splitJoinTableInput({ findingIDs: ['f-1'], addFindingIDs: ['f-2'] }, 'findingIDs')

    expect(new Set(links.add)).toEqual(new Set(['f-1', 'f-2']))
  })

  test('collects the remove-prefixed key', () => {
    const { links } = splitJoinTableInput({ removeFindingIDs: ['f-9'] }, 'findingIDs')

    expect(links.remove).toEqual(['f-9'])
  })

  test('keeps every non-join field on the entity input', () => {
    const { entityInput } = splitJoinTableInput({ refCode: 'CC1.1', addFindingIDs: ['f-1'], removeFindingIDs: ['f-2'] }, 'findingIDs')

    expect(entityInput).toEqual({ refCode: 'CC1.1' })
  })

  test('dedupes ids on both sides', () => {
    const { links } = splitJoinTableInput({ addFindingIDs: ['f-1', 'f-1'], removeFindingIDs: ['f-9', 'f-9'] }, 'findingIDs')

    expect(links.add).toEqual(['f-1'])
    expect(links.remove).toEqual(['f-9'])
  })

  test('lets add win over remove for the same id', () => {
    // Re-linking within one edit must not be cancelled by a stale removal.
    const { links } = splitJoinTableInput({ addFindingIDs: ['f-1'], removeFindingIDs: ['f-1', 'f-2'] }, 'findingIDs')

    expect(links.add).toEqual(['f-1'])
    expect(links.remove).toEqual(['f-2'])
  })

  test('ignores non-string entries and non-array values', () => {
    const input = { addFindingIDs: ['f-1', 42, null], removeFindingIDs: 'not-an-array' } as unknown as { addFindingIDs?: string[]; removeFindingIDs?: string[] }
    const { links } = splitJoinTableInput(input, 'findingIDs')

    expect(links.add).toEqual(['f-1'])
    expect(links.remove).toEqual([])
  })

  test('works for a different join field without touching similarly-named keys', () => {
    const { entityInput, links } = splitJoinTableInput({ addControlIDs: ['c-1'], addFindingIDs: ['f-1'] }, 'controlIDs')

    expect(links.add).toEqual(['c-1'])
    expect(entityInput).toEqual({ addFindingIDs: ['f-1'] })
  })
})
