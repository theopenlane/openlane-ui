import { tv, type VariantProps } from 'tailwind-variants'

export const calendarStyles = tv({
  slots: {
    root: 'p-3 rounded-md shadow-md bg-background-secondary',
    months: 'flex flex-col relative  space-y-2 sm:space-x-4 sm:space-y-0',
    month: 'space-y-2',
    caption: 'flex justify-center pt-1 absolute items-center text-center left-0 w-full top-[-6px] pointer-events-none',
    caption_label: 'text-sm font-medium',
    nav: 'space-x-1 flex items-center justify-between ',
    nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
    nav_button_previous: 'absolute left-1',
    nav_button_next: 'absolute right-1',
    table: 'w-full border-collapse space-y-1',
    head_row: 'flex',
    head_cell: 'rounded-md w-9 font-normal text-[0.8rem]',
    row: 'flex w-full mt-2',
    cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent-secondary/50 [&:has([aria-selected])]:bg-accent-secondary first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
    day_range_end: 'day-range-end',
    day_selected: 'border-2 border-teal-600 rounded-sm',
    day_today: 'rounded-sm bg-teal-100 dark:bg-teal-200 text-text-dark',
    day_outside: 'day-outside opacity-50 aria-selected:bg-oxford-blue-100/50 aria-selected:opacity-30',
    day_disabled: 'opacity-50',
    day_range_middle: 'aria-selected:bg-oxford-blue-100',
    day_hidden: 'invisible',
  },
  variants: {
    style: {
      default: {},
    },
  },
  defaultVariants: {
    style: 'default',
  },
})

export type CalendarVariants = VariantProps<typeof calendarStyles>
