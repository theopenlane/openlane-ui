import { type CampaignTargetEntry, getRecipientDisplayName, hasTarget, mergeTargets, removeTarget, toCampaignTargetInputs, toEmailKeys, toggleTarget } from './target-entry'

/**
 * ISS-2560 / #2073 — campaign recipients can be assembled from personnel,
 * contacts, a CSV and manual entry, so the same person routinely arrives twice.
 * Email is the identity key throughout, compared case- and whitespace-insensitively.
 *
 * The rules that fail silently if broken:
 *  - merging ENRICHES rather than replaces: a manual entry that later matches a
 *    contact keeps the contactID, and a blank name is filled from the duplicate
 *  - a recipient whose "name" is just their email address is sent with no name,
 *    so the email is not printed twice in the greeting
 *  - invalid and excluded emails are dropped at conversion, not earlier, so the
 *    picker can still show them
 */

const target = (over: Partial<CampaignTargetEntry> = {}): CampaignTargetEntry => ({
  email: 'user@acme.com',
  fullName: 'Ada Lovelace',
  source: 'manual',
  ...over,
})

describe('hasTarget', () => {
  test('matches ignoring case and whitespace', () => {
    const targets = [target({ email: 'user@acme.com' })]

    expect(hasTarget(targets, '  USER@ACME.COM ')).toBe(true)
    expect(hasTarget(targets, 'other@acme.com')).toBe(false)
  })
})

describe('mergeTargets', () => {
  test('keeps one entry per email regardless of case', () => {
    const merged = mergeTargets([target({ email: 'user@acme.com' })], [target({ email: 'USER@acme.com' })])

    expect(merged).toHaveLength(1)
  })

  test('fills a blank name from the incoming duplicate', () => {
    const merged = mergeTargets([target({ fullName: '' })], [target({ fullName: 'Ada Lovelace' })])

    expect(merged[0].fullName).toBe('Ada Lovelace')
  })

  test('keeps the existing name when both have one', () => {
    const merged = mergeTargets([target({ fullName: 'Existing' })], [target({ fullName: 'Incoming' })])

    expect(merged[0].fullName).toBe('Existing')
  })

  test('adopts a contactID from the duplicate when the existing entry has none', () => {
    // A manually-typed address later matched to a contact must gain its id.
    const merged = mergeTargets([target({ source: 'manual' })], [target({ source: 'contact', contactID: 'c-1' })])

    expect(merged[0].contactID).toBe('c-1')
  })

  test('does not overwrite an existing contactID', () => {
    const merged = mergeTargets([target({ contactID: 'c-1' })], [target({ contactID: 'c-2' })])

    expect(merged[0].contactID).toBe('c-1')
  })

  test('drops entries with a blank email', () => {
    expect(mergeTargets([], [target({ email: '   ' })])).toEqual([])
  })

  test('preserves distinct recipients', () => {
    const merged = mergeTargets([target({ email: 'a@acme.com' })], [target({ email: 'b@acme.com' })])

    expect(merged).toHaveLength(2)
  })
})

describe('removeTarget and toggleTarget', () => {
  test('removes ignoring case', () => {
    expect(removeTarget([target({ email: 'user@acme.com' })], 'USER@ACME.COM')).toEqual([])
  })

  test('toggle adds then removes the same recipient', () => {
    const entry = target({ email: 'user@acme.com' })
    const added = toggleTarget([], entry)
    expect(added).toHaveLength(1)

    expect(toggleTarget(added, entry)).toEqual([])
  })
})

describe('getRecipientDisplayName', () => {
  test('blanks a name that is just the email address', () => {
    expect(getRecipientDisplayName('user@acme.com', 'user@acme.com')).toBe('')
    expect(getRecipientDisplayName('  USER@ACME.COM ', 'user@acme.com')).toBe('')
  })

  test('keeps a real name, trimmed', () => {
    expect(getRecipientDisplayName('  Ada Lovelace ', 'user@acme.com')).toBe('Ada Lovelace')
  })
})

describe('toCampaignTargetInputs', () => {
  test('converts a valid recipient', () => {
    expect(toCampaignTargetInputs([target({ email: 'user@acme.com', fullName: 'Ada', contactID: 'c-1' })])).toEqual([{ email: 'user@acme.com', fullName: 'Ada', contactID: 'c-1' }])
  })

  test('drops invalid email addresses', () => {
    expect(toCampaignTargetInputs([target({ email: 'not-an-email' })])).toEqual([])
  })

  test('drops excluded emails, matched case-insensitively', () => {
    const excluded = toEmailKeys(['USER@ACME.COM'])

    expect(toCampaignTargetInputs([target({ email: 'user@acme.com' })], excluded)).toEqual([])
  })

  test('omits fullName when it is only the email address', () => {
    const [input] = toCampaignTargetInputs([target({ email: 'user@acme.com', fullName: 'user@acme.com' })])

    expect(input.fullName).toBeUndefined()
  })

  test('omits an empty contactID rather than sending a blank string', () => {
    const [input] = toCampaignTargetInputs([target({ contactID: '' })])

    expect(input.contactID).toBeUndefined()
  })

  test('trims the email it sends', () => {
    const [input] = toCampaignTargetInputs([target({ email: '  user@acme.com  ' })])

    expect(input.email).toBe('user@acme.com')
  })
})

describe('toEmailKeys', () => {
  test('normalises and drops blanks', () => {
    expect(toEmailKeys(['  USER@ACME.COM ', '', 'other@acme.com'])).toEqual(new Set(['user@acme.com', 'other@acme.com']))
  })
})
