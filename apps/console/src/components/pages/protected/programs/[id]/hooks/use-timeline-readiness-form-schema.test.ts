import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { changedTimelineFields, type TimelineReadinessFormValues } from './use-timeline-readiness-form-schema'

/**
 * ISS-2707 — an old program could not be marked complete, because the timeline form validated
 * "end date must be in the future" unconditionally. The fix makes the date rules conditional on
 * the field having changed, compared by day so a re-created Date for the same day is not an edit.
 */

const values = (over: Partial<TimelineReadinessFormValues> = {}): TimelineReadinessFormValues => ({
  startDate: null,
  endDate: null,
  status: ProgramProgramStatus.NOT_STARTED,
  ...over,
})

describe('changedTimelineFields', () => {
  test('reports nothing changed for identical values', () => {
    const initial = values({ startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') })

    expect(changedTimelineFields(initial, initial)).toEqual({ startDate: false, endDate: false, status: false })
  })

  test('ignores a time-of-day difference on the same calendar day', () => {
    // A re-created Date for the same day must not look like an edit, or an untouched past
    // end date would fail validation again.
    const initial = values({ endDate: new Date('2026-12-31T00:00:00.000Z') })
    const current = values({ endDate: new Date('2026-12-31T18:45:00.000Z') })

    expect(changedTimelineFields(current, initial).endDate).toBe(false)
  })

  test('detects a different calendar day', () => {
    const initial = values({ endDate: new Date('2026-12-31') })
    const current = values({ endDate: new Date('2027-01-01') })

    expect(changedTimelineFields(current, initial).endDate).toBe(true)
  })

  test('detects clearing a date', () => {
    expect(changedTimelineFields(values({ endDate: null }), values({ endDate: new Date('2026-12-31') })).endDate).toBe(true)
  })

  test('detects setting a previously empty date', () => {
    expect(changedTimelineFields(values({ startDate: new Date('2026-01-01') }), values({ startDate: null })).startDate).toBe(true)
  })

  test('treats null and undefined dates as equivalent', () => {
    expect(changedTimelineFields(values({ endDate: null }), values({ endDate: undefined })).endDate).toBe(false)
  })

  test('detects a status change on its own', () => {
    const initial = values({ endDate: new Date('2020-01-01'), status: ProgramProgramStatus.IN_PROGRESS })
    const current = values({ endDate: new Date('2020-01-01'), status: ProgramProgramStatus.COMPLETED })

    // The exact bug scenario: a long-past end date, only the status touched.
    // Dates must read as unchanged so the future-date rule stays out of the way.
    expect(changedTimelineFields(current, initial)).toEqual({ startDate: false, endDate: false, status: true })
  })

  test('reports each field independently', () => {
    const initial = values({ startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') })
    const current = values({ startDate: new Date('2026-02-01'), endDate: new Date('2026-12-31') })

    expect(changedTimelineFields(current, initial)).toEqual({ startDate: true, endDate: false, status: false })
  })
})
