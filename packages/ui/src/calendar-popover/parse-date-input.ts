import { format, isValid, parse } from 'date-fns'

export const DATE_INPUT_DISPLAY_FORMAT = 'MM/dd/yyyy'
export const DATE_INPUT_PLACEHOLDER = 'MM/DD/YYYY'

const MASK_SEGMENT_LENGTHS = [2, 2, 4]
const MASK_SEGMENT_MAX_FIRST_DIGIT = [1, 3]
const MASK_SEPARATOR = /[/.\s-]/
const HAS_LETTERS = /[a-z]/i

export const maskDateInput = (raw: string): string => {
  const segments = ['', '', '']
  let index = 0
  let endsWithSeparator = false

  for (const char of raw) {
    if (/\d/.test(char)) {
      if (index < 2 && segments[index].length === MASK_SEGMENT_LENGTHS[index]) {
        index += 1
      }
      if (segments[index].length === MASK_SEGMENT_LENGTHS[index]) {
        continue
      }
      const isPaddedFirstDigit = index < 2 && segments[index] === '' && Number(char) > MASK_SEGMENT_MAX_FIRST_DIGIT[index]
      segments[index] = isPaddedFirstDigit ? `0${char}` : segments[index] + char
      endsWithSeparator = false
    } else if (MASK_SEPARATOR.test(char) && index < 2 && segments[index] !== '') {
      segments[index] = segments[index].padStart(2, '0')
      index += 1
      endsWithSeparator = true
    }
  }

  const masked = segments.filter(Boolean).join('/')
  return endsWithSeparator ? `${masked}/` : masked
}

export const sanitizeDateInput = (raw: string): string => raw.replace(/[^\d/]/g, '')

export const formatPastedDateInput = (raw: string): string | null => {
  if (HAS_LETTERS.test(raw)) {
    return null
  }
  const parsed = parseDateInput(raw, () => true)
  return parsed ? format(parsed, DATE_INPUT_DISPLAY_FORMAT) : maskDateInput(raw)
}

const ENDS_WITH_TWO_DIGIT_YEAR = /\D\d{2}$/
const ENDS_WITH_FOUR_DIGIT_YEAR = /\D\d{4}$/
const STARTS_WITH_FOUR_DIGIT_YEAR = /^\d{4}\D/

type TDateInputFormat = { pattern: string; shape: RegExp }

const DATE_INPUT_FORMATS: TDateInputFormat[] = [
  { pattern: 'M/d/yyyy', shape: ENDS_WITH_FOUR_DIGIT_YEAR },
  { pattern: 'M/d/yy', shape: ENDS_WITH_TWO_DIGIT_YEAR },
  { pattern: 'M-d-yyyy', shape: ENDS_WITH_FOUR_DIGIT_YEAR },
  { pattern: 'M-d-yy', shape: ENDS_WITH_TWO_DIGIT_YEAR },
  { pattern: 'M.d.yyyy', shape: ENDS_WITH_FOUR_DIGIT_YEAR },
  { pattern: 'M.d.yy', shape: ENDS_WITH_TWO_DIGIT_YEAR },
  { pattern: 'yyyy-M-d', shape: STARTS_WITH_FOUR_DIGIT_YEAR },
  { pattern: 'yyyy/M/d', shape: STARTS_WITH_FOUR_DIGIT_YEAR },
]

export const parseDateInput = (text: string, isAcceptable: (date: Date) => boolean): Date | null => {
  const trimmed = text.trim()
  if (!trimmed || HAS_LETTERS.test(trimmed)) {
    return null
  }

  const referenceDate = new Date()
  for (const { pattern, shape } of DATE_INPUT_FORMATS) {
    if (!shape.test(trimmed)) {
      continue
    }
    const parsed = parse(trimmed, pattern, referenceDate)
    if (isValid(parsed) && isAcceptable(parsed)) {
      return parsed
    }
  }

  return null
}
