'use client'
import { DayPicker, DayPickerProps } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { calendarStyles, CalendarVariants } from './calendar.styles'
import { cn } from '../../lib/utils'

export type CalendarProps = DayPickerProps &
  CalendarVariants & {
    classNames?: Partial<(typeof calendarStyles)['slots']>
  }

function Calendar({ className, classNames: customClassNames, showOutsideDays = true, ...props }: CalendarProps) {
  const styles = calendarStyles()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(styles.root(), className)}
      classNames={{
        months: styles.months(),
        month: styles.month(),
        month_caption: styles.caption(),
        caption_label: styles.caption_label(),
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
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
