'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@udecode/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { buttonVariants } from './button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-oxford-blue-100/50 [&:has([aria-selected])]:bg-oxford-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-oxford-blue-800/50 dark:[&:has([aria-selected])]:bg-oxford-blue-800',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_disabled: 'text-oxford-blue-500 opacity-50 dark:text-oxford-blue-400',
        day_hidden: 'invisible',
        day_outside:
          'day-outside text-oxford-blue-500 opacity-50 aria-selected:bg-oxford-blue-100/50 aria-selected:text-oxford-blue-500 aria-selected:opacity-30 dark:text-oxford-blue-400 dark:aria-selected:bg-oxford-blue-800/50 dark:aria-selected:text-oxford-blue-400',
        day_range_end: 'day-range-end',
        day_range_middle:
          'aria-selected:bg-oxford-blue-100 aria-selected:text-oxford-blue-900 dark:aria-selected:bg-oxford-blue-800 dark:aria-selected:text-oxford-blue-50',
        day_selected:
          'bg-oxford-blue-900 text-oxford-blue-50 hover:bg-oxford-blue-900 hover:text-oxford-blue-50 focus:bg-oxford-blue-900 focus:text-oxford-blue-50 dark:bg-oxford-blue-50 dark:text-oxford-blue-900 dark:hover:bg-oxford-blue-50 dark:hover:text-oxford-blue-900 dark:focus:bg-oxford-blue-50 dark:focus:text-oxford-blue-900',
        day_today: 'bg-oxford-blue-100 text-oxford-blue-900 dark:bg-oxford-blue-800 dark:text-oxford-blue-50',
        head_cell:
          'text-oxford-blue-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-oxford-blue-400',
        head_row: 'flex',
        month: 'space-y-4',
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_next: 'absolute right-1',
        nav_button_previous: 'absolute left-1',
        row: 'flex w-full mt-2',
        table: 'w-full border-collapse space-y-1',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className='size-4' />,
        IconRight: () => <ChevronRight className='size-4' />,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
