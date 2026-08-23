import { mergeWhere } from './merge-where'

/**
 * ISS-2687 — system-standard exclusions have to be combined with whatever filter
 * the user has set, without either clobbering the other. mergeWhere does that
 * combination.
 *
 * Two details carry weight:
 *  - an EMPTY object is dropped, not merged. `{}` in an `and` array is harmless
 *    to some backends and a match-nothing to others; dropping it is the safe
 *    reading, and it means "no filter set" contributes nothing.
 *  - a single surviving condition is returned UNWRAPPED. Wrapping one clause in
 *    `and: [...]` needlessly nests every query and defeats predicate checks like
 *    hasStatusCondition that inspect top-level keys.
 */

type Where = { and?: Where[] | null; status?: string; refCode?: string; systemOwned?: boolean }

describe('mergeWhere', () => {
  test('returns an empty object when there is nothing to merge', () => {
    expect(mergeWhere<Where>([])).toEqual({})
    expect(mergeWhere<Where>([null, undefined])).toEqual({})
  })

  test('drops empty objects', () => {
    expect(mergeWhere<Where>([{}, {}])).toEqual({})
  })

  test('returns a single condition unwrapped', () => {
    // Wrapping one clause in `and` nests every query for no benefit.
    expect(mergeWhere<Where>([{ status: 'APPROVED' }])).toEqual({ status: 'APPROVED' })
  })

  test('returns the only non-empty condition unwrapped', () => {
    expect(mergeWhere<Where>([null, { status: 'APPROVED' }, {}, undefined])).toEqual({ status: 'APPROVED' })
  })

  test('wraps two or more conditions in an and', () => {
    expect(mergeWhere<Where>([{ status: 'APPROVED' }, { systemOwned: false }])).toEqual({
      and: [{ status: 'APPROVED' }, { systemOwned: false }],
    })
  })

  test('preserves order so the caller controls precedence', () => {
    const merged = mergeWhere<Where>([{ systemOwned: false }, { status: 'APPROVED' }, { refCode: 'CC1.1' }])

    expect(merged.and).toEqual([{ systemOwned: false }, { status: 'APPROVED' }, { refCode: 'CC1.1' }])
  })

  test('keeps a nested and intact rather than flattening it', () => {
    const exclusion: Where = { and: [{ systemOwned: false }] }
    const merged = mergeWhere<Where>([exclusion, { status: 'APPROVED' }])

    expect(merged.and?.[0]).toEqual(exclusion)
  })

  test('does not mutate the inputs', () => {
    const a: Where = { status: 'APPROVED' }
    const b: Where = { systemOwned: false }
    mergeWhere<Where>([a, b])

    expect(a).toEqual({ status: 'APPROVED' })
    expect(b).toEqual({ systemOwned: false })
  })
})
