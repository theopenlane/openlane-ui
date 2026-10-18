'use client'
import { DayPicker, DayPickerProps } from 'react-day-picker'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'

import { calendarStyles, CalendarVariants } from './calendar.styles'
import { defaultCalendarEndMonth, defaultCalendarStartMonth } from './calendar-bounds'
import { CalendarMonthCaption, CalendarMonthsDropdown, CalendarYearsDropdown } from './calendar-caption'
import { cn } from '../../lib/utils'

export type CalendarProps = DayPickerProps &
  CalendarVariants & {
    classNames?: Partial<(typeof calendarStyles)['slots']>
  }

const CHEVRON_ICONS = { left: ChevronLeft, right: ChevronRight, up: ChevronUp, down: ChevronDown }

const CalendarChevron = ({ orientation = 'left' }: { orientation?: keyof typeof CHEVRON_ICONS }) => {
  const Icon = CHEVRON_ICONS[orientation]
  return <Icon className="h-4 w-4" />
}

const Calendar = ({ className, classNames: customClassNames, showOutsideDays = true, captionLayout = 'dropdown', startMonth, endMonth, ...props }: CalendarProps) => {
  const styles = calendarStyles()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth ?? defaultCalendarStartMonth()}
      endMonth={endMonth ?? defaultCalendarEndMonth()}
      className={cn(styles.root(), className)}
      classNames={{
        months: styles.months(),
        month: styles.month(),
        month_caption: styles.caption(),
        caption_label: styles.caption_label(),
        dropdowns: styles.dropdowns(),
        nav: styles.nav(),
        month_grid: styles.month_grid(),
        day: cn(styles.cell(), customClassNames?.cell),
        selected: cn(styles.day_selected(), customClassNames?.day_selected),
        today: styles.day_today(),
        outside: styles.day_outside(),
        disabled: styles.day_disabled(),
        range_start: styles.day_range_start(),
        range_end: styles.day_range_end(),
        range_middle: styles.day_range_middle(),
        hidden: styles.day_hidden(),
        ...customClassNames,
      }}
      components={{ Chevron: CalendarChevron, MonthCaption: CalendarMonthCaption, MonthsDropdown: CalendarMonthsDropdown, YearsDropdown: CalendarYearsDropdown }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
