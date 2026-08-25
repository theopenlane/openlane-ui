import { SECTION_CACHE_MAX } from '@/lib/docs-help/constants'
import type { SectionLookup, SectionResult } from '@/lib/docs-help/types'
import { cacheKeyOf, readSectionCache, writeSectionCache } from './section-cache'

/**
 * #2148 — resolved docs sections are cached in-process. It is an LRU with a TTL,
 * and both halves have a subtle rule:
 *
 *  - a READ re-inserts the entry so it becomes most-recently-used. Without that
 *    the map keeps insertion order and eviction throws out entries that are
 *    being actively used.
 *  - the cache key must distinguish every field of the lookup, including an
 *    extractSection given as an array vs the same value as a string, otherwise
 *    two different requests share one answer.
 *
 * The cache is module-level state shared across tests, so keys here are unique
 * per test rather than reset between them.
 */

const result = (text: string): SectionResult => ({ text }) as unknown as SectionResult

const lookup = (over: Partial<SectionLookup> = {}): SectionLookup => ({ query: 'controls', ...over }) as SectionLookup

describe('cacheKeyOf', () => {
  test('is stable for the same lookup', () => {
    expect(cacheKeyOf(lookup())).toBe(cacheKeyOf(lookup()))
  })

  test('distinguishes different queries', () => {
    expect(cacheKeyOf(lookup({ query: 'a' }))).not.toBe(cacheKeyOf(lookup({ query: 'b' })))
  })

  test('distinguishes the prefer field', () => {
    expect(cacheKeyOf(lookup({ prefer: 'x' }))).not.toBe(cacheKeyOf(lookup({ prefer: 'y' })))
  })

  test('distinguishes the section argument', () => {
    expect(cacheKeyOf(lookup(), 'one')).not.toBe(cacheKeyOf(lookup(), 'two'))
  })

  test('joins an array extractSection so multi-section lookups stay distinct', () => {
    expect(cacheKeyOf(lookup({ extractSection: ['a', 'b'] }))).not.toBe(cacheKeyOf(lookup({ extractSection: ['a'] })))
  })

  test('produces a stable key when the optional fields are absent', () => {
    // `prefer` and `section` collapse to '' but a missing `extractSection`
    // stringifies to the literal "undefined". That is untidy rather than wrong:
    // it is consistent, so two lookups without one still share a key. Only a
    // lookup whose extractSection is literally the string "undefined" would
    // collide, which is not a real input.
    expect(cacheKeyOf(lookup())).toBe(cacheKeyOf(lookup()))
    expect(cacheKeyOf(lookup())).toBe('controls||undefined|')
  })
})

describe('read/write round-trip', () => {
  test('returns null for a key that was never written', () => {
    expect(readSectionCache('never-written-key')).toBeNull()
  })

  test('reads back a written result', () => {
    writeSectionCache('roundtrip-key', result('hello'))

    expect(readSectionCache('roundtrip-key')).toEqual(result('hello'))
  })

  test('a later write for the same key replaces the earlier one', () => {
    writeSectionCache('replace-key', result('first'))
    writeSectionCache('replace-key', result('second'))

    expect(readSectionCache('replace-key')).toEqual(result('second'))
  })
})

describe('LRU eviction', () => {
  test('evicts the oldest entries once the cache exceeds its maximum', () => {
    const prefix = `evict-${Date.now()}-`
    for (let i = 0; i < SECTION_CACHE_MAX + 5; i++) {
      writeSectionCache(`${prefix}${i}`, result(String(i)))
    }

    // The first writes are gone; the most recent survive.
    expect(readSectionCache(`${prefix}0`)).toBeNull()
    expect(readSectionCache(`${prefix}${SECTION_CACHE_MAX + 4}`)).toEqual(result(String(SECTION_CACHE_MAX + 4)))
  })

  test('reading an entry protects it from the next eviction sweep', () => {
    const prefix = `lru-${Date.now()}-`
    writeSectionCache(`${prefix}kept`, result('kept'))

    // Fill past the cap, re-reading the entry partway so it becomes MRU.
    for (let i = 0; i < SECTION_CACHE_MAX - 1; i++) {
      writeSectionCache(`${prefix}${i}`, result(String(i)))
      if (i === Math.floor(SECTION_CACHE_MAX / 2)) readSectionCache(`${prefix}kept`)
    }
    writeSectionCache(`${prefix}last`, result('last'))

    expect(readSectionCache(`${prefix}kept`)).toEqual(result('kept'))
  })
})
