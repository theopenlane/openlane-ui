import { inferDateOrder, isAmbiguousDate, isCanonicalDate, isIsoCalendarDate, isRfc3339Timestamp, normalizeLooseDate, type TDateOrder } from './loose-date'

const REFERENCE_YEAR = 2026

const normalize = (raw: string, { order = 'MDY', timestamp = false }: { order?: TDateOrder; timestamp?: boolean } = {}) => normalizeLooseDate(raw, { order, timestamp, referenceYear: REFERENCE_YEAR })

const expectLocalTimestamp = (result: string | null, [year, month, day, hours = 0, minutes = 0, seconds = 0]: number[]) => {
  expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/)
  expect(new Date(result as string).getTime()).toBe(new Date(year, month - 1, day, hours, minutes, seconds).getTime())
}

describe('isIsoCalendarDate', () => {
  it.each(['2026-03-05', '2024-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isIsoCalendarDate(value)).toBe(true)
  })

  it.each(['2026-3-5', '2026-13-01', '2026-02-29', '2026-04-31', '2026-03-05T00:00:00Z', ' 2026-03-05', ''])('rejects %p', (value) => {
    expect(isIsoCalendarDate(value)).toBe(false)
  })
})

describe('isRfc3339Timestamp', () => {
  it.each(['2026-03-05T10:00:00Z', '2026-03-05T23:59:59.123Z', '2026-03-05T10:00:00+05:30', '2026-03-05T10:00:00-08:00'])('accepts %s', (value) => {
    expect(isRfc3339Timestamp(value)).toBe(true)
  })

  it.each([
    '2026-03-05',
    '2026-03-05T10:00:00',
    '2026-03-05 10:00:00Z',
    '2026-03-05t10:00:00Z',
    '2026-03-05T24:00:00Z',
    '2026-03-05T10:60:00Z',
    '2026-03-05T10:00:60Z',
    '2026-03-05T10:00:00+24:00',
    '2026-03-05T10:00:00+05:60',
    '2026-02-30T10:00:00Z',
  ])('rejects %s', (value) => {
    expect(isRfc3339Timestamp(value)).toBe(false)
  })
})

describe('isCanonicalDate', () => {
  it('accepts a plain date only when the field is not a timestamp', () => {
    expect(isCanonicalDate('2026-03-05', false)).toBe(true)
    expect(isCanonicalDate('2026-03-05', true)).toBe(false)
  })

  it('accepts an RFC 3339 timestamp for both kinds of field', () => {
    expect(isCanonicalDate('2026-03-05T10:00:00Z', false)).toBe(true)
    expect(isCanonicalDate('2026-03-05T10:00:00Z', true)).toBe(true)
  })

  it('rejects loose formats', () => {
    expect(isCanonicalDate('03/05/2026', false)).toBe(false)
    expect(isCanonicalDate('March 5, 2026', true)).toBe(false)
  })
})

describe('normalizeLooseDate', () => {
  describe('canonical values', () => {
    it('returns an ISO date unchanged', () => {
      expect(normalize('2026-03-05')).toBe('2026-03-05')
    })

    it('returns an RFC 3339 timestamp unchanged', () => {
      expect(normalize('2026-03-05T10:00:00.5+02:00')).toBe('2026-03-05T10:00:00.5+02:00')
      expect(normalize('2026-03-05T10:00:00Z', { timestamp: true })).toBe('2026-03-05T10:00:00Z')
    })

    it('trims and collapses whitespace first', () => {
      expect(normalize('  2026-03-05 ')).toBe('2026-03-05')
      expect(normalize(' March   5,  2026 ')).toBe('2026-03-05')
    })

    it('replaces the space in a zoned timestamp with a T', () => {
      expect(normalize('2026-03-05 10:00:00+02:00')).toBe('2026-03-05T10:00:00+02:00')
      expect(normalize('2026-03-05 10:00:00.250Z', { timestamp: true })).toBe('2026-03-05T10:00:00.250Z')
    })
  })

  describe('year-first dates', () => {
    it.each([
      ['2026/3/5', '2026-03-05'],
      ['2026.03.05', '2026-03-05'],
      ['2026-3-5', '2026-03-05'],
    ])('reads %s as %s', (raw, expected) => {
      expect(normalize(raw)).toBe(expected)
    })

    it('ignores the day/month order', () => {
      expect(normalize('2026/3/5', { order: 'DMY' })).toBe('2026-03-05')
    })

    it('requires one separator throughout', () => {
      expect(normalize('2026/03-05')).toBeNull()
    })
  })

  describe('numeric dates', () => {
    it('reads the first number as the month under MDY', () => {
      expect(normalize('03/05/2026', { order: 'MDY' })).toBe('2026-03-05')
    })

    it('reads the first number as the day under DMY', () => {
      expect(normalize('03/05/2026', { order: 'DMY' })).toBe('2026-05-03')
    })

    it.each(['03-05-2026', '03.05.2026'])('accepts the %s separator', (raw) => {
      expect(normalize(raw)).toBe('2026-03-05')
    })

    it('rejects a value that is impossible in the chosen order', () => {
      expect(normalize('13/05/2026', { order: 'MDY' })).toBeNull()
      expect(normalize('13/05/2026', { order: 'DMY' })).toBe('2026-05-13')
    })

    it('rejects mixed separators', () => {
      expect(normalize('03/05-2026')).toBeNull()
    })

    it('fills a yearless slash date with the reference year', () => {
      expect(normalize('3/5')).toBe(`${REFERENCE_YEAR}-03-05`)
      expect(normalize('3/5', { order: 'DMY' })).toBe(`${REFERENCE_YEAR}-05-03`)
    })

    it.each(['3-5', '3.5'])('rejects the yearless %s, which is not read as a date', (raw) => {
      expect(normalize(raw)).toBeNull()
    })

    it.each([
      ['3/5/00', '2000-03-05'],
      ['3/5/29', '2029-03-05'],
      ['3/5/30', '1930-03-05'],
      ['3/5/99', '1999-03-05'],
    ])('expands the two-digit year in %s to %s', (raw, expected) => {
      expect(normalize(raw)).toBe(expected)
    })

    it('rejects a three-digit year', () => {
      expect(normalize('3/5/202')).toBeNull()
    })
  })

  describe('dates with a month name', () => {
    it.each([
      ['March 5, 2026', '2026-03-05'],
      ['march 5 2026', '2026-03-05'],
      ['Mar 5, 2026', '2026-03-05'],
      ['Mar. 5th, 2026', '2026-03-05'],
      ['Sept 5, 2026', '2026-09-05'],
      ['Sep-5-26', '2026-09-05'],
      ['Thursday, March 5, 2026', '2026-03-05'],
      ['Thu. March 5, 2026', '2026-03-05'],
    ])('reads the month-first %s as %s', (raw, expected) => {
      expect(normalize(raw)).toBe(expected)
    })

    it.each([
      ['5 March 2026', '2026-03-05'],
      ['5th March, 2026', '2026-03-05'],
      ['05-Mar-2026', '2026-03-05'],
      ['5-mar-26', '2026-03-05'],
      ['Thu 5 March 2026', '2026-03-05'],
    ])('reads the day-first %s as %s', (raw, expected) => {
      expect(normalize(raw)).toBe(expected)
    })

    it('ignores the day/month order, since the month is named', () => {
      expect(normalize('March 5, 2026', { order: 'DMY' })).toBe('2026-03-05')
      expect(normalize('5 March 2026', { order: 'MDY' })).toBe('2026-03-05')
    })

    it('fills a missing year with the reference year', () => {
      expect(normalize('March 5')).toBe(`${REFERENCE_YEAR}-03-05`)
      expect(normalize('5 Mar')).toBe(`${REFERENCE_YEAR}-03-05`)
    })

    it('rejects an unknown month name', () => {
      expect(normalize('Smarch 5, 2026')).toBeNull()
      expect(normalize('5 Marc 2026')).toBeNull()
    })

    it('rejects a day the month does not have', () => {
      expect(normalize('February 30, 2026')).toBeNull()
      expect(normalize('31 April 2026')).toBeNull()
    })
  })

  describe('Excel serial numbers', () => {
    it('reads a whole serial as a date', () => {
      expect(normalize('45000')).toBe('2023-03-15')
      expect(normalize('46086')).toBe('2026-03-05')
    })

    it('reads the fraction as a local time of day', () => {
      expectLocalTimestamp(normalize('45000.5'), [2023, 3, 15, 12])
      expectLocalTimestamp(normalize('45000.75', { timestamp: true }), [2023, 3, 15, 18])
    })

    it('clamps a fraction that rounds up to midnight to the last second of the day', () => {
      expectLocalTimestamp(normalize('45000.999999999'), [2023, 3, 15, 23, 59, 59])
    })

    it.each(['4500', '450000'])('rejects %s, which is not five digits', (raw) => {
      expect(normalize(raw)).toBeNull()
    })
  })

  describe('calendar validation', () => {
    it('accepts a leap day only in a leap year', () => {
      expect(normalize('2/29/2028')).toBe('2028-02-29')
      expect(normalize('2/29/2026')).toBeNull()
    })

    it.each(['0/5/2026', '3/0/2026', '3/32/2026', '2026/13/01'])('rejects %s', (raw) => {
      expect(normalize(raw)).toBeNull()
    })
  })

  describe('times', () => {
    it('turns a date into local midnight for a timestamp field', () => {
      expectLocalTimestamp(normalize('2026-03-05', { timestamp: true }), [2026, 3, 5])
      expectLocalTimestamp(normalize('March 5, 2026', { timestamp: true }), [2026, 3, 5])
    })

    it('keeps a time given with a date, even for a date field', () => {
      expectLocalTimestamp(normalize('3/5/2026 14:30'), [2026, 3, 5, 14, 30])
    })

    it.each([
      ['3/5/2026 2:30 PM', [2026, 3, 5, 14, 30]],
      ['3/5/2026 2:30pm', [2026, 3, 5, 14, 30]],
      ['3/5/2026 2:30 p.m.', [2026, 3, 5, 14, 30]],
      ['3/5/2026 12:00 AM', [2026, 3, 5, 0, 0]],
      ['3/5/2026 12:00 PM', [2026, 3, 5, 12, 0]],
      ['3/5/2026, 9:05:07', [2026, 3, 5, 9, 5, 7]],
      ['3/5/2026 09:05:07.123', [2026, 3, 5, 9, 5, 7]],
      ['2026-03-05T09:05', [2026, 3, 5, 9, 5]],
      ['March 5, 2026 9:05 am', [2026, 3, 5, 9, 5]],
      ['5 Mar 2026 21:15', [2026, 3, 5, 21, 15]],
    ])('reads %s as local time', (raw, parts) => {
      expectLocalTimestamp(normalize(raw as string, { timestamp: true }), parts as number[])
    })

    it.each(['3/5/2026 24:00', '3/5/2026 10:60', '3/5/2026 10:00:60', '3/5/2026 13:00 PM', '3/5/2026 0:30 AM'])('rejects the out-of-range time in %s', (raw) => {
      expect(normalize(raw, { timestamp: true })).toBeNull()
    })
  })

  it.each(['', '   ', 'not a date', 'N/A', 'TBD', '2026', '03/05/2026/01'])('rejects %p', (raw) => {
    expect(normalize(raw)).toBeNull()
  })
})

describe('isAmbiguousDate', () => {
  it.each(['03/05/2026', '3/5/26', '3-5-2026', '3.5.2026', '3/5', ' 03/05/2026 ', '3/5/2026 10:00'])('flags %p, which reads differently in each order', (value) => {
    expect(isAmbiguousDate(value)).toBe(true)
  })

  it.each([
    ['13/05/2026', 'the first number can only be a day'],
    ['05/13/2026', 'the second number can only be a day'],
    ['05/05/2026', 'both orders give the same date'],
    ['0/5/2026', 'zero is not a month'],
    ['3-5', 'a yearless dash value is not read as a date'],
    ['2026-03-05', 'a year-first date has one reading'],
    ['March 5, 2026', 'the month is named'],
    ['45000', 'an Excel serial has one reading'],
  ])('does not flag %s: %s', (value) => {
    expect(isAmbiguousDate(value)).toBe(false)
  })
})

describe('inferDateOrder', () => {
  it('picks DMY when a value can only be day-first', () => {
    expect(inferDateOrder(['03/05/2026', '13/05/2026'])).toBe('DMY')
  })

  it('picks MDY when a value can only be month-first', () => {
    expect(inferDateOrder(['03/05/2026', '05/13/2026'])).toBe('MDY')
  })

  it('follows the majority of unambiguous values', () => {
    expect(inferDateOrder(['13/05/2026', '14/05/2026', '05/13/2026'])).toBe('DMY')
    expect(inferDateOrder(['05/13/2026', '05/14/2026', '13/05/2026'])).toBe('MDY')
  })

  it('breaks a tie towards MDY', () => {
    expect(inferDateOrder(['13/05/2026', '05/13/2026'])).toBe('MDY')
  })

  it('accepts any iterable', () => {
    expect(inferDateOrder(new Set(['13/05/2026']))).toBe('DMY')
  })

  it('ignores values that are not day/month numbers', () => {
    expect(inferDateOrder(['13/05/2026', '2026-05-14', 'May 14, 2026', '14-5', '45000'])).toBe('DMY')
  })

  describe('without a deciding value', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('falls back to the browser locale and remembers it', () => {
      const formatToParts = jest.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
        { type: 'day', value: '22' },
        { type: 'literal', value: '/' },
        { type: 'month', value: '11' },
        { type: 'literal', value: '/' },
        { type: 'year', value: '2000' },
      ])

      expect(inferDateOrder(['03/05/2026', '2026-05-14', 'May 14, 2026'])).toBe('DMY')
      expect(inferDateOrder([])).toBe('DMY')
      expect(formatToParts).toHaveBeenCalledTimes(1)
    })
  })
})
