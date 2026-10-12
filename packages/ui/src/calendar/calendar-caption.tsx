'use client'
import { createContext, useContext, useState } from 'react'
import { useDayPicker, type DropdownProps, type MonthCaptionProps } from 'react-day-picker'
import { addMonths, setMonth, setYear, startOfMonth } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select/select'

type TCaptionDropdown = 'month' | 'year'

type TCalendarCaption = {
  month: Date
  displayIndex: number
  container: HTMLElement | null
  openDropdown: TCaptionDropdown | null
  setOpenDropdown: (dropdown: TCaptionDropdown | null) => void
}

const CalendarCaptionContext = createContext<TCalendarCaption | null>(null)

export const CalendarMonthCaption = ({ calendarMonth, displayIndex, ...props }: MonthCaptionProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [openDropdown, setOpenDropdown] = useState<TCaptionDropdown | null>(null)
  return (
    <CalendarCaptionContext.Provider value={{ month: calendarMonth.date, displayIndex, container, openDropdown, setOpenDropdown }}>
      <div ref={setContainer} {...props} />
    </CalendarCaptionContext.Provider>
  )
}

type TCaptionSelectProps = DropdownProps & {
  dropdown: TCaptionDropdown
  toMonth: (displayedMonth: Date, picked: number) => Date
}

const CaptionSelect = ({ options, value, disabled, 'aria-label': ariaLabel, dropdown, toMonth }: TCaptionSelectProps) => {
  const { goToMonth } = useDayPicker()
  const caption = useContext(CalendarCaptionContext)

  const handleValueChange = (picked: string) => {
    if (!caption) {
      return
    }
    const month = toMonth(startOfMonth(caption.month), Number(picked))
    goToMonth(addMonths(month, -caption.displayIndex))
  }

  return (
    <Select
      value={String(value)}
      disabled={disabled}
      open={caption?.openDropdown === dropdown}
      onOpenChange={(open) => caption?.setOpenDropdown(open ? dropdown : null)}
      onValueChange={handleValueChange}
    >
      <SelectTrigger aria-label={ariaLabel} className="h-7 w-auto gap-1 border-0 bg-transparent px-2 font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <SelectValue />
      </SelectTrigger>
      <SelectContent container={caption?.container} className="max-h-64">
        {options?.map((option) => (
          <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled} className="px-3 py-2">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const CalendarMonthsDropdown = (props: DropdownProps) => <CaptionSelect {...props} dropdown="month" toMonth={setMonth} />

export const CalendarYearsDropdown = (props: DropdownProps) => <CaptionSelect {...props} dropdown="year" toMonth={setYear} />
