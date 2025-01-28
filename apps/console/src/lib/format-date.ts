export function formatDate(isoDate: Date | string | number): string {
  // returns date in format Month Day, Year Hour:Minute AM/PM
  const date = new Date(isoDate)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }

  return date.toLocaleDateString('en-US', options)
}
