import { tv, type VariantProps } from 'tailwind-variants'

export const calendarStyles = tv({
  slots: {
    root: 'p-3',
    months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
    month: 'space-y-4',
    caption: 'flex justify-center pt-1 relative items-center',
    caption_label: 'text-sm font-medium',
    nav: 'space-x-1 flex items-center',
    nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
    nav_button_previous: 'absolute left-1',
    nav_button_next: 'absolute right-1',
    table: 'w-full border-collapse space-y-1',
    head_row: 'flex',
    head_cell:
      'text-slate-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-slate-400',
    row: 'flex w-full mt-2',
    cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-java-400/50 [&:has([aria-selected])]:bg-java-400 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 ',
    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
    day_range_end: 'day-range-end',
    day_selected:
      'rounded-sm bg-java-600 text-slate-50 hover:bg-java-600 hover:text-slate-50',
    day_today:
      'rounded-sm bg-oxford-blue-900 text-oxford-blue-800 dark:bg-slate-800 dark:text-slate-50',
    day_outside:
      'day-outside text-slate-500 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30 dark:text-slate-400 dark:aria-selected:bg-slate-800/50 dark:aria-selected:text-slate-400',
    day_disabled: 'text-slate-500 opacity-50 dark:text-slate-400',
    day_range_middle:
      'aria-selected:bg-slate-100 aria-selected:text-oxford-blue-800 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50',
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
