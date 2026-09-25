import { MS_PER_DAY } from '@/utils/date'

export const DATE_ORDERS = ['MDY', 'DMY'] as const
export type TDateOrder = (typeof DATE_ORDERS)[number]

type TDateParts = { year: number; month: number; day: number; hours?: number; minutes?: number; seconds?: number }

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const RFC3339 = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/
const ZONED_WITH_SPACE = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))$/
const TIME = String.raw`(?:(?:,? |T)(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)? ?([ap]\.?m\.?)?)?`
const WEEKDAY = String.raw`(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,? )?`
const YEAR_FIRST = new RegExp(String.raw`^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})${TIME}$`, 'i')
const NUMERIC = new RegExp(String.raw`^(\d{1,2})([-/.])(\d{1,2})(?:\2(\d{4}|\d{2}))?${TIME}$`, 'i')
const MONTH_FIRST = new RegExp(String.raw`^${WEEKDAY}([a-z]{3,9})\.?[ -](\d{1,2})(?:st|nd|rd|th)?(?:,?[ -](\d{4}|\d{2}))?${TIME}$`, 'i')
const DAY_FIRST = new RegExp(String.raw`^${WEEKDAY}(\d{1,2})(?:st|nd|rd|th)?[ -]([a-z]{3,9})\.?(?:,?[ -](\d{4}|\d{2}))?${TIME}$`, 'i')
const EXCEL_SERIAL = /^(\d{5})(\.\d+)?$/
const YEARLESS_NUMERIC_SEPARATOR = '/'

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTH_BY_NAME = new Map<string, number>([
  ...MONTHS.flatMap((name, index): [string, number][] => [
    [name, index + 1],
    [name.slice(0, 3), index + 1],
  ]),
  ['sept', 9],
])
const MAX_MONTH = 12
const MAX_HOUR = 23
const MAX_MINUTE = 59
const HOURS_PER_HALF_DAY = 12
const TWO_DIGIT_YEAR_PIVOT = 30
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)
const SECONDS_PER_DAY = MS_PER_DAY / 1000 // 1 day
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ')

const isCalendarDate = ({ year, month, day }: TDateParts): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export const isIsoCalendarDate = (value: string): boolean => {
  const match = DATE_ONLY.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  return isCalendarDate({ year, month, day })
}

export const isRfc3339Timestamp = (value: string): boolean => {
  const match = RFC3339.exec(value)
  if (!match) return false
  const [, date, hour, minute, second, , , offsetHour, offsetMinute] = match
  const withinRange = [hour, offsetHour ?? '0'].every((part) => Number(part) <= MAX_HOUR) && [minute, second, offsetMinute ?? '0'].every((part) => Number(part) <= MAX_MINUTE)
  return withinRange && isIsoCalendarDate(date)
}

export const isCanonicalDate = (value: string, timestamp: boolean): boolean => isRfc3339Timestamp(value) || (!timestamp && isIsoCalendarDate(value))

const expandYear = (raw: string | undefined, referenceYear: number): number => {
  if (raw === undefined) return referenceYear
  const year = Number(raw)
  if (raw.length === 4) return year
  return year < TWO_DIGIT_YEAR_PIVOT ? 2000 + year : 1900 + year
}

const withTime = (date: TDateParts, [hours, minutes, seconds, meridiem]: (string | undefined)[]): TDateParts | null => {
  if (hours === undefined) return date
  let hour = Number(hours)
  if (meridiem) {
    if (hour < 1 || hour > HOURS_PER_HALF_DAY) return null
    hour = (hour % HOURS_PER_HALF_DAY) + (meridiem.toLowerCase().startsWith('p') ? HOURS_PER_HALF_DAY : 0)
  }
  const minute = Number(minutes)
  const second = Number(seconds ?? 0)
  if (hour > MAX_HOUR || minute > MAX_MINUTE || second > MAX_MINUTE) return null
  return { ...date, hours: hour, minutes: minute, seconds: second }
}

const fromExcelSerial = (whole: string, fraction: string | undefined): TDateParts => {
  const date = new Date(EXCEL_EPOCH_UTC + Number(whole) * MS_PER_DAY)
  const parts = { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
  const totalSeconds = Math.min(Math.round(Number(fraction ?? 0) * SECONDS_PER_DAY), SECONDS_PER_DAY - 1)
  if (totalSeconds === 0) return parts
  return {
    ...parts,
    hours: Math.floor(totalSeconds / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  }
}

const withMonthName = (monthName: string, day: string, year: string | undefined, time: (string | undefined)[], referenceYear: number): TDateParts | null => {
  const month = MONTH_BY_NAME.get(monthName.toLowerCase())
  return month ? withTime({ year: expandYear(year, referenceYear), month, day: Number(day) }, time) : null
}

const parseDateParts = (value: string, order: TDateOrder, referenceYear: number): TDateParts | null => {
  const yearFirst = YEAR_FIRST.exec(value)
  if (yearFirst) {
    const [, year, , month, day, ...time] = yearFirst
    return withTime({ year: Number(year), month: Number(month), day: Number(day) }, time)
  }

  const numeric = NUMERIC.exec(value)
  if (numeric) {
    const [, first, separator, second, year, ...time] = numeric
    if (year === undefined && separator !== YEARLESS_NUMERIC_SEPARATOR) return null
    const [month, day] = order === 'MDY' ? [first, second] : [second, first]
    return withTime({ year: expandYear(year, referenceYear), month: Number(month), day: Number(day) }, time)
  }

  const monthFirst = MONTH_FIRST.exec(value)
  if (monthFirst) {
    const [, monthName, day, year, ...time] = monthFirst
    return withMonthName(monthName, day, year, time, referenceYear)
  }

  const dayFirst = DAY_FIRST.exec(value)
  if (dayFirst) {
    const [, day, monthName, year, ...time] = dayFirst
    return withMonthName(monthName, day, year, time, referenceYear)
  }

  const serial = EXCEL_SERIAL.exec(value)
  return serial ? fromExcelSerial(serial[1], serial[2]) : null
}

const formatOffset = (offsetMinutes: number): string => {
  if (offsetMinutes === 0) return 'Z'
  const east = -offsetMinutes
  const absolute = Math.abs(east)
  return `${east > 0 ? '+' : '-'}${pad(Math.floor(absolute / MINUTES_PER_HOUR))}:${pad(absolute % MINUTES_PER_HOUR)}`
}

const formatParts = (parts: TDateParts, timestamp: boolean): string | null => {
  const date = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`
  if (parts.hours === undefined && !timestamp) return date
  const { hours = 0, minutes = 0, seconds = 0 } = parts
  const local = new Date(parts.year, parts.month - 1, parts.day, hours, minutes, seconds)
  if (local.getHours() !== hours || local.getDate() !== parts.day) return null
  return `${date}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}${formatOffset(local.getTimezoneOffset())}`
}

export const normalizeLooseDate = (raw: string, { order, timestamp, referenceYear }: { order: TDateOrder; timestamp: boolean; referenceYear: number }): string | null => {
  const value = normalizeSpaces(raw)
  if (isCanonicalDate(value, timestamp)) return value
  const zoned = value.replace(ZONED_WITH_SPACE, '$1T$2')
  if (zoned !== value && isRfc3339Timestamp(zoned)) return zoned
  const parts = parseDateParts(value, order, referenceYear)
  return parts && isCalendarDate(parts) ? formatParts(parts, timestamp) : null
}

const readNumericDayMonth = (value: string): [number, number] | null => {
  const match = NUMERIC.exec(normalizeSpaces(value))
  if (!match) return null
  const [, first, separator, second, year] = match
  return year !== undefined || separator === YEARLESS_NUMERIC_SEPARATOR ? [Number(first), Number(second)] : null
}

export const isAmbiguousDate = (value: string): boolean => {
  const parts = readNumericDayMonth(value)
  return parts !== null && parts[0] !== parts[1] && parts.every((part) => part >= 1 && part <= MAX_MONTH)
}

let localeOrder: TDateOrder | undefined

const localeDateOrder = (): TDateOrder => {
  if (!localeOrder) {
    const types = new Intl.DateTimeFormat().formatToParts(new Date(2000, 10, 22)).map((part) => part.type)
    localeOrder = types.indexOf('day') < types.indexOf('month') ? 'DMY' : 'MDY'
  }
  return localeOrder
}

export const inferDateOrder = (values: Iterable<string>): TDateOrder => {
  let monthFirst = 0
  let dayFirst = 0
  for (const value of values) {
    const parts = readNumericDayMonth(value)
    if (!parts) continue
    const [first, second] = parts
    if (first > MAX_MONTH && second <= MAX_MONTH) dayFirst++
    if (second > MAX_MONTH && first <= MAX_MONTH) monthFirst++
  }
  if (monthFirst === 0 && dayFirst === 0) return localeDateOrder()
  return dayFirst > monthFirst ? 'DMY' : 'MDY'
}

export const DATE_ORDER_LABELS: Record<TDateOrder, string> = { MDY: 'month/day/year', DMY: 'day/month/year' }

export const DATE_ORDER_SHORT_LABELS: Record<TDateOrder, string> = { MDY: 'M/D/Y', DMY: 'D/M/Y' }
