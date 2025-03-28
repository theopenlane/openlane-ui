'use client'
import { DayPicker, DayPickerProps } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { calendarStyles, CalendarVariants } from './calendar.styles'
import { cn } from '../../lib/utils'
import { buttonStyles } from '../button/button'

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
        nav_button: cn(buttonStyles({ variant: 'outline' }), styles.nav_button(), customClassNames?.nav_button),
        nav_button_previous: styles.nav_button_previous(),
        nav_button_next: styles.nav_button_next(),
        table: styles.table(),
        head_row: styles.head_row(),
        head_cell: styles.head_cell(),
        row: styles.row(),
        cell: styles.cell(),
        day: cn(buttonStyles({ variant: 'outline' }), styles.cell(), customClassNames?.cell),
        day_range_end: styles.day_range_end(),
        selected: cn(styles.day_selected(), customClassNames?.day_selected),
        today: styles.day_today(),
        outside: styles.day_outside(),
        disabled: styles.day_disabled(),
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
