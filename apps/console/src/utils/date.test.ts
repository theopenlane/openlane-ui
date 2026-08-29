import { formatTimeSince, formatDateSince, formatDateTime, formatDate, isPastDate, formatDateTimeWithZone, formatTimeZoneLabel, getBrowserTimeZone } from './date'

describe('formatTimeSince', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return "5 minutes ago" if the date is 5 minutes ago', () => {
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
    const result = formatTimeSince(fiveMinutesAgo.toString())
    expect(result).toBe('5 minutes ago')
  })

  it('should return "2 hours ago" if the date is 2 hours ago', () => {
    const twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
    const result = formatTimeSince(twoHoursAgo.toString())
    expect(result).toBe('2 hours ago')
  })

  it('should return "5 days ago" if the date is 5 days ago', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const result = formatTimeSince(fiveDaysAgo.toString())
    expect(result).toBe('5 days ago')
  })

  it('should return formatted date and time if the date is more than 30 days ago', () => {
    const moreThan30DaysAgo = new Date()
    moreThan30DaysAgo.setDate(moreThan30DaysAgo.getDate() - 31)

    const result = formatTimeSince(moreThan30DaysAgo.toString())
    expect(result).toBe(formatDateTime(moreThan30DaysAgo.toString()))
  })

  it('should handle edge case where the date is exactly 30 days ago', () => {
    const exactly30DaysAgo = new Date()
    exactly30DaysAgo.setDate(exactly30DaysAgo.getDate() - 30)

    const result = formatTimeSince(exactly30DaysAgo.toString())
    expect(result).toBe('30 days ago')
  })

  it('should handle null date input', () => {
    const result = formatTimeSince('')
    expect(result).toBe('-')
  })

  it('should handle undefined date input', () => {
    const result = formatTimeSince(undefined)
    expect(result).toBe('-')
  })
})

describe('formatDateSince', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return "15 minutes ago" if the date is 15 minutes ago', () => {
    const fifteenMinutesAgo = new Date()
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)
    const result = formatDateSince(fifteenMinutesAgo.toString())
    expect(result).toBe('15 minutes ago')
  })

  it('should return "1 hour ago" if the date is 1 hour ago', () => {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    const result = formatDateSince(oneHourAgo.toString())
    expect(result).toBe('1 hours ago')
  })

  it('should return "23 hours ago" if the date is 23 hours ago', () => {
    const twentyThreeHoursAgo = new Date()
    twentyThreeHoursAgo.setHours(twentyThreeHoursAgo.getHours() - 23)
    const result = formatDateSince(twentyThreeHoursAgo.toString())
    expect(result).toBe('23 hours ago')
  })

  it('should return "5 days ago" if the date is 5 days ago', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const result = formatDateSince(fiveDaysAgo.toString())
    expect(result).toBe('5 days ago')
  })

  it('should return formatted date and time if the date is more than 30 days ago', () => {
    const moreThan30DaysAgo = new Date()
    moreThan30DaysAgo.setDate(moreThan30DaysAgo.getDate() - 31)

    const result = formatDateSince(moreThan30DaysAgo.toString())
    expect(result).toBe(formatDate(moreThan30DaysAgo.toString()))
  })

  it('should handle edge case where the date is exactly 30 days ago', () => {
    const exactly30DaysAgo = new Date()
    exactly30DaysAgo.setDate(exactly30DaysAgo.getDate() - 30)

    const result = formatDateSince(exactly30DaysAgo.toString())
    expect(result).toBe('30 days ago')
  })

  it('should handle null date input', () => {
    const result = formatDateSince('')
    expect(result).toBe('-')
  })

  it('should handle undefined date input', () => {
    const result = formatDateSince(undefined)
    expect(result).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('should format date correctly', () => {
    const date = new Date('2023-10-01T12:00:00Z')
    const result = formatDateTime(date.toString())
    expect(result).toBe('October 1, 2023 12:00 PM')
  })

  it('should handle null date input', () => {
    const result = formatDateTime('')
    expect(result).toBe('-')
  })

  it('should handle undefined date input', () => {
    const result = formatDateTime(undefined)
    expect(result).toBe('-')
  })
})

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2023-10-01T12:00:00Z')
    const result = formatDate(date.toString())
    expect(result).toBe('October 1, 2023')
  })

  it('should handle null date input', () => {
    const result = formatDate('')
    expect(result).toBe('-')
  })

  it('should handle undefined date input', () => {
    const result = formatDate(undefined)
    expect(result).toBe('-')
  })
})

// The program landing page marks overdue audit periods with isPastDate. Empty input must read as "not past"
// rather than falling through to an Invalid Date comparison.
describe('isPastDate', () => {
  it('returns false for undefined, null and empty input', () => {
    expect(isPastDate(undefined)).toBe(false)
    expect(isPastDate(null)).toBe(false)
    expect(isPastDate('')).toBe(false)
  })

  it('returns true for a date in the past', () => {
    expect(isPastDate('2000-01-01T00:00:00.000Z')).toBe(true)
  })

  it('returns false for a date in the future', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(isPastDate(future)).toBe(false)
  })

  it('handles a date-only string', () => {
    expect(isPastDate('1999-12-31')).toBe(true)
  })
})

/**
 * Campaign launch scheduling gained a timezone selector, so scheduled times must be shown with their zone. A
 * bare "March 3, 2026 9:00 AM" is ambiguous once a campaign can be scheduled from another zone.
 */
describe('formatDateTimeWithZone', () => {
  it('falls back for empty input', () => {
    expect(formatDateTimeWithZone(undefined)).toBe('-')
    expect(formatDateTimeWithZone(null)).toBe('-')
    expect(formatDateTimeWithZone('')).toBe('-')
  })

  it('honours a custom fallback', () => {
    expect(formatDateTimeWithZone('', 'Not scheduled')).toBe('Not scheduled')
  })

  it('renders a date, a time and a parenthesised zone abbreviation', () => {
    const formatted = formatDateTimeWithZone('2026-03-03T09:00:00.000Z')

    expect(formatted).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2} (AM|PM)/)
    expect(formatted).toMatch(/\([^)]+\)$/)
  })

  it('always includes a zone, unlike the plain formatter', () => {
    const iso = '2026-03-03T09:00:00.000Z'

    expect(formatDateTimeWithZone(iso)).not.toBe(formatDateTime(iso))
  })
})

describe('formatTimeZoneLabel', () => {
  const when = new Date('2026-03-03T09:00:00.000Z')

  it('prefixes a GMT offset and humanises underscores', () => {
    expect(formatTimeZoneLabel('America/New_York', when)).toMatch(/^\(GMT[+-]\d{2}:\d{2}\) America\/New York$/)
  })

  it('renders UTC with a zero offset', () => {
    expect(formatTimeZoneLabel('UTC', when)).toBe('(GMT+00:00) UTC')
  })

  it('falls back to the bare zone name when the offset cannot be resolved', () => {
    expect(formatTimeZoneLabel('Not/AZone', when)).toBe('Not/AZone')
  })
})

describe('getBrowserTimeZone', () => {
  it('returns a non-empty IANA zone name', () => {
    expect(getBrowserTimeZone()).toMatch(/\S/)
  })
})
