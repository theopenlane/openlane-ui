import { tv, type VariantProps } from 'tailwind-variants'

export const calendarStyles = tv({
  slots: {
    root: 'p-3 rounded-md shadow-md bg-card',
    months: 'flex flex-col relative  space-y-2 sm:space-x-4 sm:space-y-0',
    month: 'space-y-2',
    caption: 'flex justify-center pt-1 absolute items-center text-center left-0 w-full top-[-6px] pointer-events-none',
    caption_label: 'text-sm font-medium',
    nav: 'space-x-1 flex items-center justify-between mb-4',
    month_grid: 'border-separate border-spacing-0',
    cell: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&>button]:bg-transparent',
    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
    day_selected: 'border-2 border-teal-600 rounded-xs',
    day_today: 'rounded-xs bg-primary-muted text-text-dark',
    day_outside: 'day-outside opacity-50 aria-selected:opacity-30',
    day_disabled: 'opacity-50',
    day_range_start: 'bg-primary-muted',
    day_range_end: 'bg-primary-muted',
    day_range_middle: 'bg-primary-muted rounded-none! border-transparent!',
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
