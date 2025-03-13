'use client'
import React, { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { FieldValues, Path, ControllerRenderProps } from 'react-hook-form'
import { Button } from '../button/button'
import { calendarPopoverStyles } from '../calendar-popover/calendar-popover.styles'
import { Calendar } from '../calendar/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select/select'

type TCustomSelect = {
  value: any
  label: string
}

export type CalendarPopoverProps<T extends FieldValues> = {
  field?: ControllerRenderProps<T, Path<T>>
  defaultToday?: boolean
  defaultAddDays?: number
  required?: boolean
  customSelect?: TCustomSelect[]
  buttonClassName?: string
}

const CalendarPopover = <T extends FieldValues>({ field, defaultToday, required, defaultAddDays, customSelect, buttonClassName }: CalendarPopoverProps<T>) => {
  const todayDate = defaultToday ? new Date() : undefined
  const defaultAddDaysDate = defaultAddDays ? addDays(new Date(), defaultAddDays) : undefined
  const defaultDate = defaultAddDaysDate ?? todayDate ?? null
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [value, setValue] = useState<Date | null>(defaultDate)
  const { calendarInput, calendarPopover: calendarPopoverStyle } = calendarPopoverStyles()

  useEffect(() => {
    if (field && field.value !== undefined) {
      setValue(field.value)
    }
  }, [field?.value])

  const handleForm = (calendarValue: Date) => {
    field && field.onChange(calendarValue)
    setValue(calendarValue)
    setIsCalendarOpen(false)
  }

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation()
    field?.value && field.onChange(null)
    setValue(null)
  }

  const handleSelectChange = (value: any) => {
    const selectedValue = addDays(new Date(), parseInt(value))
    setValue(selectedValue)
    field?.value && field.onChange(selectedValue)
    setIsCalendarOpen(false)
  }

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          className={
            buttonClassName ??
            '!h-12 w-full flex justify-between items-center border border-neutral-300 border-input dark:border-brand !p-1  text-base rounded-md focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50'
          }
          variant="outlineInput"
          childFull
        >
          <div className={calendarInput()}>
            <span>{value ? format(value, 'PPP') : 'Select a date:'}</span>
            <div className="flex items-center gap-x-2">
              {value && !required && <X className="h-4 w-4 opacity-50 cursor-pointer" onClick={(e) => handleClearDate(e)} />}
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={calendarPopoverStyle()} align="start">
        {customSelect && (
          <Select onValueChange={(value) => handleSelectChange(value)}>
            <SelectTrigger className="bg-background-secondary">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent position="popper">
              {customSelect.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(calendarValue) => {
            calendarValue && handleForm(calendarValue)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

CalendarPopover.displayName = 'CalendarPopover'

export { CalendarPopover }
