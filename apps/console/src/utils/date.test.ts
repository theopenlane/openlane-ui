import { formatTimeSince, formatDateSince, formatDateTime, formatDate } from './date'

describe('formatTimeSince', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return "0 days ago" if the date is today', () => {
    const today = new Date()
    const result = formatTimeSince(today.toString())
    expect(result).toBe('0 days ago')
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

  it('should return "0 days ago" if the date is today', () => {
    const today = new Date()
    const result = formatDateSince(today.toString())
    expect(result).toBe('0 days ago')
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
