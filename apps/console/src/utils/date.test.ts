import { formatTimeSince, formatDateSince, formatDateTime, formatDate } from './date'

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
