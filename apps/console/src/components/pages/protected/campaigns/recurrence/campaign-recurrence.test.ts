import { CampaignFrequency } from '@repo/codegen/src/schema'
import { buildRecurrenceUpdateInput, describeCampaignRecurrence, describeRecurrence, toRecurrenceValues, type CampaignRecurrenceSource, type CampaignRecurrenceValues } from './campaign-recurrence'

/**
 * #2110 — recurring campaigns. buildRecurrenceUpdateInput must emit clearRecurrenceEndAt when
 * the end date is removed; omitting the key silently keeps the old one.
 */

const source = (over: Partial<CampaignRecurrenceSource> = {}): CampaignRecurrenceSource =>
  ({
    isRecurring: false,
    recurrenceFrequency: null,
    recurrenceInterval: null,
    recurrenceTimezone: null,
    recurrenceEndAt: null,
    ...over,
  }) as CampaignRecurrenceSource

const values = (over: Partial<CampaignRecurrenceValues> = {}): CampaignRecurrenceValues => ({
  isRecurring: true,
  frequency: CampaignFrequency.MONTHLY,
  interval: 1,
  timezone: 'UTC',
  endAt: null,
  ...over,
})

describe('toRecurrenceValues', () => {
  test('produces safe defaults for a null campaign', () => {
    const result = toRecurrenceValues(null)

    expect(result.isRecurring).toBe(false)
    expect(result.frequency).toBe(CampaignFrequency.MONTHLY)
    expect(result.interval).toBe(1)
    expect(result.endAt).toBeNull()
    expect(result.timezone).toMatch(/\S/)
  })

  test('coerces a NONE frequency to the first supported one', () => {
    expect(toRecurrenceValues(source({ recurrenceFrequency: CampaignFrequency.NONE })).frequency).toBe(CampaignFrequency.MONTHLY)
  })

  test('coerces a zero or negative interval to 1', () => {
    expect(toRecurrenceValues(source({ recurrenceInterval: 0 })).interval).toBe(1)
    expect(toRecurrenceValues(source({ recurrenceInterval: -2 })).interval).toBe(1)
  })

  test('preserves a real frequency, interval and timezone', () => {
    const result = toRecurrenceValues(source({ isRecurring: true, recurrenceFrequency: CampaignFrequency.QUARTERLY, recurrenceInterval: 2, recurrenceTimezone: 'America/New_York' }))

    expect(result).toMatchObject({ isRecurring: true, frequency: CampaignFrequency.QUARTERLY, interval: 2, timezone: 'America/New_York' })
  })

  test('parses an end date into a Date', () => {
    const result = toRecurrenceValues(source({ recurrenceEndAt: '2026-12-31T00:00:00.000Z' }))

    expect(result.endAt).toBeInstanceOf(Date)
  })
})

describe('buildRecurrenceUpdateInput', () => {
  test('sends only isRecurring:false when recurrence is off', () => {
    expect(buildRecurrenceUpdateInput(values({ isRecurring: false }))).toEqual({ isRecurring: false })
  })

  test('sends the full recurrence shape when on', () => {
    const input = buildRecurrenceUpdateInput(values({ frequency: CampaignFrequency.QUARTERLY, interval: 2, timezone: 'UTC', endAt: new Date('2026-12-31T00:00:00.000Z') }))

    expect(input).toMatchObject({
      isRecurring: true,
      recurrenceFrequency: CampaignFrequency.QUARTERLY,
      recurrenceInterval: 2,
      recurrenceTimezone: 'UTC',
      recurrenceEndAt: '2026-12-31T00:00:00.000Z',
    })
  })

  test('explicitly clears the end date when it is removed', () => {
    // Omitting the key would leave the previous end date in place.
    const input = buildRecurrenceUpdateInput(values({ endAt: null }))

    expect(input).toMatchObject({ clearRecurrenceEndAt: true })
    expect(input).not.toHaveProperty('recurrenceEndAt')
  })
})

describe('describeRecurrence', () => {
  test('reports a non-recurring campaign', () => {
    expect(describeRecurrence({ isRecurring: false, frequency: CampaignFrequency.MONTHLY, interval: 1 })).toBe('Does not repeat')
  })

  test('reports a NONE frequency as non-recurring even when the flag is on', () => {
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.NONE, interval: 1 })).toBe('Does not repeat')
  })

  test('describes single-cycle frequencies', () => {
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.MONTHLY, interval: 1 })).toBe('Every month')
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.QUARTERLY, interval: 1 })).toBe('Every 3 months')
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.YEARLY, interval: 1 })).toBe('Every year')
  })

  test('folds whole years rather than reporting months', () => {
    // 12 monthly cycles is "Every year", not "Every 12 months".
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.MONTHLY, interval: 12 })).toBe('Every year')
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.QUARTERLY, interval: 8 })).toBe('Every 2 years')
  })

  test('multiplies frequency by interval', () => {
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.MONTHLY, interval: 2 })).toBe('Every 2 months')
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.BIANNUALLY, interval: 1 })).toBe('Every 6 months')
  })

  test('treats a zero or negative interval as 1', () => {
    expect(describeRecurrence({ isRecurring: true, frequency: CampaignFrequency.MONTHLY, interval: 0 })).toBe('Every month')
  })
})

describe('describeCampaignRecurrence', () => {
  test('reads recurrence straight off a campaign record', () => {
    expect(describeCampaignRecurrence(source({ isRecurring: true, recurrenceFrequency: CampaignFrequency.QUARTERLY, recurrenceInterval: 1 }))).toBe('Every 3 months')
  })

  test('reports a campaign with no recurrence set', () => {
    expect(describeCampaignRecurrence(source())).toBe('Does not repeat')
  })
})
