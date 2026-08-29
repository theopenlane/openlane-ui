import { dedupeEmails, isDuplicateEmail, isUlid, isValidEmail, normalizeEmail } from './validators'

/**
 * ISS-2428 — pressing Tab in the invite email input added a duplicate chip, because the two call
 * sites hand-rolled their own comparison and one of them compared un-normalised strings. Case and
 * surrounding whitespace are the whole point.
 */
describe('normalizeEmail', () => {
  test('lowercases and trims', () => {
    expect(normalizeEmail('  User@Acme.COM  ')).toBe('user@acme.com')
  })
})

describe('isDuplicateEmail', () => {
  test('is false against an empty list', () => {
    expect(isDuplicateEmail('user@acme.com', [])).toBe(false)
  })

  test('detects an exact match', () => {
    expect(isDuplicateEmail('user@acme.com', ['user@acme.com'])).toBe(true)
  })

  test('detects a match differing only by case', () => {
    expect(isDuplicateEmail('User@Acme.COM', ['user@acme.com'])).toBe(true)
  })

  test('detects a match differing only by surrounding whitespace', () => {
    // This is the Tab-key path: the raw input still carries whitespace.
    expect(isDuplicateEmail('  user@acme.com  ', ['user@acme.com'])).toBe(true)
  })

  test('normalises the existing entries too, not just the candidate', () => {
    expect(isDuplicateEmail('user@acme.com', ['  USER@ACME.COM '])).toBe(true)
  })

  test('is false for a genuinely different address', () => {
    expect(isDuplicateEmail('other@acme.com', ['user@acme.com'])).toBe(false)
  })
})

describe('dedupeEmails', () => {
  test('returns an empty list unchanged', () => {
    expect(dedupeEmails([])).toEqual([])
  })

  test('keeps the first occurrence and its original casing', () => {
    expect(dedupeEmails(['User@Acme.com', 'user@acme.com', 'USER@ACME.COM'])).toEqual(['User@Acme.com'])
  })

  test('preserves order across distinct addresses', () => {
    expect(dedupeEmails(['b@acme.com', 'a@acme.com', 'b@acme.com'])).toEqual(['b@acme.com', 'a@acme.com'])
  })

  test('treats whitespace-padded duplicates as the same address', () => {
    expect(dedupeEmails(['user@acme.com', ' user@acme.com '])).toHaveLength(1)
  })
})

describe('isValidEmail', () => {
  test.each(['user@acme.com', 'first.last@sub.acme.co.uk', 'user+tag@acme.io'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  test.each(['', 'user', 'user@', '@acme.com', 'user@acme', 'user @acme.com', 'user@ acme.com'])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false)
  })
})

describe('isUlid', () => {
  test('accepts a 26-character ULID in either case', () => {
    expect(isUlid('01HXAMPLEUSER0000000000000')).toBe(true)
    expect(isUlid('01hxampleuser0000000000000')).toBe(true)
  })

  test.each([
    ['too short', '01HXAMPLE'],
    ['too long', '01HXAMPLEUSER00000000000000'],
    ['a hyphenated uuid', '123e4567-e89b-12d3-a456-426614174000'],
    ['empty', ''],
  ])('rejects %s', (_label, value) => {
    expect(isUlid(value)).toBe(false)
  })
})
