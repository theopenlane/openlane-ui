import { differenceInCalendarDays, format, isPast, isToday, isTomorrow } from 'date-fns'
import { tzOffset } from '@date-fns/tz'

export const MS_PER_DAY = 24 * 60 * 60 * 1000

// dateFallback is a helper for all date formats to determine the correct fallback value
const dateFallback = (empty?: string): string => {
  if (empty) {
    return empty
  }

  return '-'
}

/*
 * Formats a date to a human-readable string in "MMMM d, yyyy" format.
 * If the date is null, it returns a dash ("-").
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
const formatDate = (date: string | null | undefined, empty?: string): string => {
  if (!date || date === '') {
    return dateFallback(empty)
  }

  return format(new Date(date), 'MMMM d, yyyy')
}

export { formatDate }

const isPastDate = (date: string | null | undefined): boolean => {
  if (!date || date === '') {
    return false
  }

  return isPast(new Date(date))
}

export { isPastDate }

/*
 * Formats a date to a human-readable string in "MMMM d, yyyy hh:mm aa" format.
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
const formatDateTime = (date: string | null | undefined, empty?: string): string => {
  if (!date || date === '') {
    return dateFallback(empty)
  }

  return format(new Date(date), 'MMMM d, yyyy h:mm aa')
}

export { formatDateTime }

/*
 * Formats a date to a human-readable string.
 * If the date is within the last 30 days, it returns "X days ago".
 * Otherwise, it returns the formatted date in "MMMM d, yyyy hh:mm aa" format.
 *
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
const formatTimeSince = (date: string | null | undefined, empty?: string): string => {
  if (!date || date === '') {
    return dateFallback(empty)
  }

  const now = new Date()
  const dateObj = new Date(date)
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays <= 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours <= 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    }
    return `${diffInHours} hours ago`
  }

  if (diffInDays <= 30) {
    return `${diffInDays} days ago`
  } else {
    return formatDateTime(date)
  }
}

export { formatTimeSince }

/*
 * This function formats a date to a string. If the date is within 30 days from now, it returns the number of days since that date.
 * Otherwise, it returns the formatted date in "MMMM d, yyyy" format.
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date or time since.
 */
const formatDateSince = (date: string | null | undefined, empty?: string): string => {
  if (!date || date === '') {
    return dateFallback(empty)
  }

  const now = new Date()
  const dateObj = new Date(date)
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays <= 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours <= 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    }
    return `${diffInHours} hours ago`
  }

  if (diffInDays <= 30) {
    return `${diffInDays} days ago`
  } else {
    return formatDate(date)
  }
}

export { formatDateSince }

const formatDateUntil = (date: string | null | undefined, empty?: string): string => {
  if (!date || date === '') {
    return dateFallback(empty)
  }

  const dateObj = new Date(date)

  if (isToday(dateObj)) {
    return 'today'
  }

  if (isTomorrow(dateObj)) {
    return 'tomorrow'
  }

  const daysUntil = differenceInCalendarDays(dateObj, new Date())

  if (daysUntil > 1 && daysUntil < 7) {
    return format(dateObj, 'EEEE')
  }

  return formatDate(date)
}

export { formatDateUntil }

const computeDueDate = (responseDueDuration?: number | null): string | undefined => {
  if (!responseDueDuration || responseDueDuration <= 0) return undefined
  return new Date(Date.now() + responseDueDuration * 1000).toISOString()
}

export { computeDueDate }

const formatCurrency = (cost?: number | null): string | undefined => {
  return cost ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cost) : 'Not set'
}

export { formatCurrency }

const getBrowserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone

export { getBrowserTimeZone }

const formatUtcOffset = (offsetMinutes: number): string => {
  const sign = offsetMinutes < 0 ? '-' : '+'
  const absMinutes = Math.abs(offsetMinutes)
  return `GMT${sign}${String(Math.floor(absMinutes / 60)).padStart(2, '0')}:${String(absMinutes % 60).padStart(2, '0')}`
}

const formatTimeZoneLabel = (timeZone: string, date: Date): string => {
  const offsetMinutes = tzOffset(timeZone, date)
  const zoneName = timeZone.replaceAll('_', ' ')
  return Number.isNaN(offsetMinutes) ? zoneName : `(${formatUtcOffset(offsetMinutes)}) ${zoneName}`
}

export { formatTimeZoneLabel }

const shortZoneNameFormat = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })

const formatDateTimeWithZone = (date: string | null | undefined, empty?: string): string => {
  if (!date || date === '') {
    return dateFallback(empty)
  }

  const dateObj = new Date(date)
  const zoneName = shortZoneNameFormat.formatToParts(dateObj).find((part) => part.type === 'timeZoneName')?.value
  return `${format(dateObj, 'MMMM d, yyyy h:mm aa')}${zoneName ? ` (${zoneName})` : ''}`
}

export { formatDateTimeWithZone }
