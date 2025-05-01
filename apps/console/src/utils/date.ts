import { format } from 'date-fns'

/*
 * Formats a date to a human-readable string in "MMMM d, yyyy" format.
 * If the date is null, it returns a dash ("-").
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
const formatDate = (date: string | null | undefined): string => {
  if (!date || date === '') {
    return '-'
  }

  return format(new Date(date), 'MMMM d, yyyy')
}

export { formatDate }

/*
 * Formats a date to a human-readable string in "MMMM d, yyyy hh:mm aa" format.
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
const formatDateTime = (date: string | null | undefined): string => {
  if (!date || date === '') {
    return '-'
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
const formatTimeSince = (date: string | null | undefined): string => {
  if (!date || date === '') {
    return '-'
  }

  const now = new Date()
  const dateObj = new Date(date)
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

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
const formatDateSince = (date: string | null | undefined): string => {
  if (!date || date === '') {
    return '-'
  }

  const now = new Date()
  const dateObj = new Date(date)
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays <= 30) {
    return `${diffInDays} days ago`
  } else {
    return formatDate(date)
  }
}

export { formatDateSince }
