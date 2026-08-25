import { getRevisionKind, makeGroupResolver, parseRevision, toPlateValue } from './utils'

/**
 * ISS-2256 — the policy history diff printed raw group ULIDs for Approver and
 * Delegate. makeGroupResolver maps an id to its group name, falling back to the
 * id when the name is not loaded yet, and passing null/undefined straight
 * through so an unset field still diffs as empty rather than as the string
 * "undefined".
 *
 * parseRevision / getRevisionKind back the major-vs-minor badge on the same tab.
 */
describe('makeGroupResolver', () => {
  const map = new Map([['01HXGROUP0000000000000000A', 'Security Team']])

  test('resolves a known id to its group name', () => {
    expect(makeGroupResolver(map)('01HXGROUP0000000000000000A')).toBe('Security Team')
  })

  test('falls back to the raw id when the name is not in the map', () => {
    expect(makeGroupResolver(map)('01HXUNKNOWN00000000000000B')).toBe('01HXUNKNOWN00000000000000B')
  })

  test('falls back to the raw id when there is no map at all', () => {
    expect(makeGroupResolver(undefined)('01HXGROUP0000000000000000A')).toBe('01HXGROUP0000000000000000A')
  })

  test('passes null and undefined through unchanged', () => {
    // A cleared approver must stay empty in the diff, not become "undefined".
    expect(makeGroupResolver(map)(null)).toBeNull()
    expect(makeGroupResolver(map)(undefined)).toBeUndefined()
  })

  test('passes an empty string through unchanged', () => {
    expect(makeGroupResolver(map)('')).toBe('')
  })
})

describe('parseRevision', () => {
  test('parses a plain semver triple', () => {
    expect(parseRevision('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
  })

  test('tolerates a leading v in either case', () => {
    expect(parseRevision('v1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
    expect(parseRevision('V1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
  })

  test('returns null for empty, short or non-numeric revisions', () => {
    expect(parseRevision(null)).toBeNull()
    expect(parseRevision(undefined)).toBeNull()
    expect(parseRevision('')).toBeNull()
    expect(parseRevision('1.2')).toBeNull()
    expect(parseRevision('v1.x.3')).toBeNull()
  })
})

describe('getRevisionKind', () => {
  test('is major only when both minor and patch are zero', () => {
    expect(getRevisionKind('v2.0.0')).toBe('major')
  })

  test('is minor when either minor or patch is non-zero', () => {
    expect(getRevisionKind('v2.1.0')).toBe('minor')
    expect(getRevisionKind('v2.0.1')).toBe('minor')
  })

  test('defaults to minor for an unparseable revision', () => {
    expect(getRevisionKind(null)).toBe('minor')
    expect(getRevisionKind('draft')).toBe('minor')
  })
})

describe('toPlateValue', () => {
  test('passes an array through', () => {
    const value = [{ type: 'p', children: [{ text: 'hi' }] }]
    expect(toPlateValue(value)).toBe(value)
  })

  test('returns null for anything that is not an array', () => {
    expect(toPlateValue(null)).toBeNull()
    expect(toPlateValue(undefined)).toBeNull()
    expect(toPlateValue('<p>hi</p>')).toBeNull()
    expect(toPlateValue({ type: 'p' })).toBeNull()
  })
})
