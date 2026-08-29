import { type TPagination } from '@repo/ui/pagination-types'
import { sliceByPagination } from './pagination'

/**
 * Client-side pagination for lists the API returns whole. Pages are 1-based, and the Math.max guard stops a
 * stale stored page of 0 or negative from reading backwards off the array.
 */

const page = (page: number, pageSize: number): TPagination => ({ page, pageSize, query: { first: pageSize } }) as TPagination

const items = ['a', 'b', 'c', 'd', 'e']

describe('sliceByPagination', () => {
  test('page 1 starts at the beginning', () => {
    expect(sliceByPagination(items, page(1, 2))).toEqual(['a', 'b'])
  })

  test('page 2 continues from where page 1 ended', () => {
    expect(sliceByPagination(items, page(2, 2))).toEqual(['c', 'd'])
  })

  test('the last page returns the remainder, not a full page', () => {
    expect(sliceByPagination(items, page(3, 2))).toEqual(['e'])
  })

  test('a page past the end returns nothing', () => {
    expect(sliceByPagination(items, page(9, 2))).toEqual([])
  })

  test('a page size larger than the list returns everything', () => {
    expect(sliceByPagination(items, page(1, 50))).toEqual(items)
  })

  test('clamps page 0 and negative pages to the first slice', () => {
    // A stale stored pagination can hand back page 0; reading backwards off the array would silently return
    // the tail.
    expect(sliceByPagination(items, page(0, 2))).toEqual(['a', 'b'])
    expect(sliceByPagination(items, page(-3, 2))).toEqual(['a', 'b'])
  })

  test('returns nothing for an empty list', () => {
    expect(sliceByPagination([], page(1, 10))).toEqual([])
  })

  test('does not mutate the input', () => {
    const original = [...items]
    sliceByPagination(items, page(2, 2))

    expect(items).toEqual(original)
  })
})
