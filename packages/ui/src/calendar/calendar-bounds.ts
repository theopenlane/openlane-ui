import { addYears, endOfYear, startOfYear, subYears } from 'date-fns'

const CALENDAR_YEARS_BACK = 100
const CALENDAR_YEARS_FORWARD = 50

export const defaultCalendarStartMonth = () => startOfYear(subYears(new Date(), CALENDAR_YEARS_BACK))

export const defaultCalendarEndMonth = () => endOfYear(addYears(new Date(), CALENDAR_YEARS_FORWARD))
