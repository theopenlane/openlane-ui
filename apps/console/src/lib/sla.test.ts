import { addDays, startOfDay, subDays } from 'date-fns'
import { type Condition, type ConditionValue } from '@/types'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { buildDueSoonCondition, buildPastDueCondition, buildSlaDaysByLevel, DUE_SOON_WINDOW_DAYS, getSlaDueDate, isSlaPastDue } from './sla'

/**
 * ISS-2482 — the past-due calculation was duplicated across the attention table, the
 * vulnerability/finding tables and the SLA badge, each with its own casing and null handling.
 * It now lives here.
 */

const def = (securityLevel: string | null, slaDays: number | null): SlaDefinitionsNodeNonNull => ({ securityLevel, slaDays }) as unknown as SlaDefinitionsNodeNonNull

// The builders emit flat `{ securityLevel, createdAt* }` records; narrow to exactly that
// member of ConditionValue rather than indexing through the union at every assertion.
type SlaBranch = { [operator: string]: string | number }

const isBranchList = (value: ConditionValue | undefined): value is SlaBranch[] => Array.isArray(value)

const orBranches = (condition: Condition): SlaBranch[] => {
  const branches = condition.or
  if (!isBranchList(branches)) throw new Error('expected the condition to carry an or[] branch list')
  return branches
}

describe('buildSlaDaysByLevel', () => {
  test('indexes definitions by uppercased security level', () => {
    expect(buildSlaDaysByLevel([def('critical', 7), def('High', 30)])).toEqual({ CRITICAL: 7, HIGH: 30 })
  })

  test('keeps the first definition for a level and ignores later duplicates', () => {
    expect(buildSlaDaysByLevel([def('CRITICAL', 7), def('critical', 99)])).toEqual({ CRITICAL: 7 })
  })

  test('drops definitions with no security level', () => {
    expect(buildSlaDaysByLevel([def(null, 7)])).toEqual({})
  })

  test('drops non-positive and non-numeric slaDays', () => {
    expect(buildSlaDaysByLevel([def('LOW', 0), def('MEDIUM', -1), def('HIGH', null)])).toEqual({})
  })

  test('returns an empty index for no definitions', () => {
    expect(buildSlaDaysByLevel([])).toEqual({})
  })
})

describe('getSlaDueDate', () => {
  const levels = { CRITICAL: 7 }

  test('adds the level slaDays to the created date', () => {
    const due = getSlaDueDate('2026-07-01T00:00:00.000Z', 'CRITICAL', levels)
    expect(due?.toISOString()).toBe(addDays(new Date('2026-07-01T00:00:00.000Z'), 7).toISOString())
  })

  test('matches the security level case-insensitively', () => {
    expect(getSlaDueDate('2026-07-01T00:00:00.000Z', 'critical', levels)).not.toBeNull()
  })

  test('returns null when the level has no SLA', () => {
    expect(getSlaDueDate('2026-07-01T00:00:00.000Z', 'LOW', levels)).toBeNull()
  })

  test('returns null for missing createdAt or securityLevel', () => {
    expect(getSlaDueDate(null, 'CRITICAL', levels)).toBeNull()
    expect(getSlaDueDate('2026-07-01T00:00:00.000Z', null, levels)).toBeNull()
    expect(getSlaDueDate('', 'CRITICAL', levels)).toBeNull()
  })

  test('returns null for an unparseable createdAt', () => {
    expect(getSlaDueDate('not-a-date', 'CRITICAL', levels)).toBeNull()
  })
})

describe('isSlaPastDue', () => {
  test('is true for a date in the past', () => {
    expect(isSlaPastDue(subDays(new Date(), 1))).toBe(true)
  })

  test('is false for a date in the future', () => {
    expect(isSlaPastDue(addDays(new Date(), 1))).toBe(false)
  })

  test('is false for null and undefined', () => {
    expect(isSlaPastDue(null)).toBe(false)
    expect(isSlaPastDue(undefined)).toBe(false)
  })
})

describe('buildPastDueCondition', () => {
  test('scopes to open records and one or-branch per level', () => {
    const condition = buildPastDueCondition({ CRITICAL: 7, HIGH: 30 })

    expect(condition.open).toBe(true)
    expect(orBranches(condition)).toHaveLength(2)
    expect(orBranches(condition)[0]).toMatchObject({ securityLevel: 'CRITICAL' })
  })

  test('anchors each branch to the start of the day minus slaDays', () => {
    const condition = buildPastDueCondition({ CRITICAL: 7 })
    const expected = subDays(startOfDay(new Date()), 7).toISOString()

    expect(orBranches(condition)[0]).toMatchObject({ createdAtLT: expected })
  })

  test('produces no branches when there are no SLA definitions', () => {
    expect(orBranches(buildPastDueCondition({}))).toEqual([])
  })
})

describe('buildDueSoonCondition', () => {
  test('brackets each level between its due date and the look-ahead window', () => {
    const condition = buildDueSoonCondition({ CRITICAL: 7 })
    const lower = subDays(startOfDay(new Date()), 7)

    expect(orBranches(condition)[0]).toMatchObject({
      securityLevel: 'CRITICAL',
      createdAtGTE: lower.toISOString(),
      createdAtLT: addDays(lower, DUE_SOON_WINDOW_DAYS).toISOString(),
    })
  })

  test('uses a 14-day look-ahead window', () => {
    expect(DUE_SOON_WINDOW_DAYS).toBe(14)
  })
})
