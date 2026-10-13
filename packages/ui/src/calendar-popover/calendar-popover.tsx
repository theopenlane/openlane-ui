'use client'
import React, { useEffect, useRef, useState } from 'react'
import { addDays, format, isSameDay, startOfDay, startOfMonth } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent, PopoverPortal, PopoverTrigger } from '@radix-ui/react-popover'
import { FieldValues, Path, ControllerRenderProps } from 'react-hook-form'
import { Button } from '../button/button'
import { calendarPopoverStyles } from '../calendar-popover/calendar-popover.styles'
import { Calendar } from '../calendar/calendar'
import { defaultCalendarEndMonth, defaultCalendarStartMonth } from '../calendar/calendar-bounds'
import { DATE_INPUT_DISPLAY_FORMAT, DATE_INPUT_PLACEHOLDER, formatPastedDateInput, maskDateInput, parseDateInput, sanitizeDateInput } from './parse-date-input'
import { cn } from '../../lib/utils'

const DEFAULT_INPUT_LABEL = 'Date'

export type CalendarPopoverProps<T extends FieldValues> = {
  field?: ControllerRenderProps<T, Path<T>>
  defaultToday?: boolean
  defaultAddDays?: number
  defaultValue?: Date | null
  required?: boolean
  buttonClassName?: string
  inputClassName?: string
  disabledFrom?: Date
  disableFuture?: boolean
  onChange?: (val: Date | null) => void
  showNowButton?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  contentRef?: React.Ref<HTMLDivElement>
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-labelledby'?: string
}

const CalendarPopover = <T extends FieldValues>({
  field,
  defaultToday,
  required,
  defaultAddDays,
  defaultValue,
  buttonClassName,
  inputClassName,
  disabledFrom,
  disableFuture,
  onChange,
  showNowButton,
  side,
  align = 'start',
  contentRef,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
}: CalendarPopoverProps<T>) => {
  const todayDate = defaultToday ? new Date() : undefined
  const defaultAddDaysDate = defaultAddDays ? addDays(new Date(), defaultAddDays) : undefined
  const defaultDate = defaultValue ?? defaultAddDaysDate ?? todayDate ?? null
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined)
  const [value, setValue] = useState<Date | null>(defaultDate)
  const [draft, setDraft] = useState<string | null>(null)
  const [isDraftInvalid, setIsDraftInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectOnMouseUpRef = useRef(false)
  const { calendarInput, calendarPopover: calendarPopoverStyle } = calendarPopoverStyles()

  const discardDraft = () => {
    setDraft(null)
    setIsDraftInvalid(false)
  }

  useEffect(() => {
    if (field && field.value !== undefined) {
      setValue(field.value)
      discardDraft()
    }
  }, [field?.value])

  useEffect(() => {
    if (draft === null) {
      return
    }
    const discardDraftOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.target !== inputRef.current) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      discardDraft()
    }
    window.addEventListener('keydown', discardDraftOnEscape, { capture: true })
    return () => window.removeEventListener('keydown', discardDraftOnEscape, { capture: true })
  }, [draft])

  const now = new Date()
  const earliestDate = disabledFrom ? startOfDay(disabledFrom) : undefined
  const startMonth = earliestDate ? startOfMonth(earliestDate) : defaultCalendarStartMonth()
  const endMonth = disableFuture ? now : defaultCalendarEndMonth()

  const isDateDisabled = (date: Date) => {
    const isBeforeMin = earliestDate ? date < earliestDate : false
    const isAfterToday = disableFuture ? date > now : false
    return isBeforeMin || isAfterToday
  }

  const isWithinRange = (date: Date) => date >= startMonth && date <= endMonth && !isDateDisabled(date)

  const changeDate = (date: Date | null) => {
    discardDraft()
    field?.onChange(date)
    onChange?.(date)
    setValue(date)
  }

  const commitDraft = ({ revertInvalid }: { revertInvalid: boolean }) => {
    if (draft === null) {
      return
    }
    const committedValue = field ? (field.value ?? null) : value

    if (!draft.trim()) {
      if (!required && (value || committedValue)) {
        changeDate(null)
      } else {
        discardDraft()
      }
      return
    }

    const parsed = parseDateInput(draft, isWithinRange)
    if (!parsed) {
      if (revertInvalid) {
        discardDraft()
      } else {
        setIsDraftInvalid(true)
      }
      return
    }
    if (committedValue && isSameDay(parsed, committedValue)) {
      discardDraft()
      return
    }
    changeDate(parsed)
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitDraft({ revertInvalid: false })
    } else if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault()
      handleCalendarOpenChange(true)
    }
  }

  const handleCalendarOpenChange = (open: boolean) => {
    if (open) {
      const pendingDate = draft === null ? null : parseDateInput(draft, isWithinRange)
      setCalendarMonth(pendingDate ?? value ?? undefined)
      discardDraft()
    }
    setIsCalendarOpen(open)
  }

  const keepInputFocus = (event: React.MouseEvent) => event.preventDefault()

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: raw, selectionStart } = event.target
    const inputType = event.nativeEvent instanceof InputEvent ? event.nativeEvent.inputType : ''
    const isTypingAtEnd = !inputType.startsWith('delete') && selectionStart === raw.length
    if (inputType === 'insertFromPaste') {
      const pasted = formatPastedDateInput(raw)
      if (pasted === null) {
        return
      }
      setDraft(pasted)
    } else {
      setDraft(isTypingAtEnd ? maskDateInput(raw) : sanitizeDateInput(raw))
    }
    setIsDraftInvalid(false)
  }

  const handleInputMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    if (selectOnMouseUpRef.current) {
      selectOnMouseUpRef.current = false
      event.preventDefault()
    }
  }

  const handleCalendarSelect = (calendarValue: Date | undefined) => {
    if (!calendarValue) {
      return
    }
    changeDate(calendarValue)
    setIsCalendarOpen(false)
  }

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation()
    changeDate(null)
  }

  const handleNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    changeDate(new Date())
  }

  const setInputRef = (element: HTMLInputElement | null) => {
    inputRef.current = element
    field?.ref(element)
  }

  const displayText = draft ?? (value ? format(value, DATE_INPUT_DISPLAY_FORMAT) : '')
  const isInvalid = isDraftInvalid || ariaInvalid

  return (
    <Popover open={isCalendarOpen} onOpenChange={handleCalendarOpenChange}>
      <div className={cn('relative', buttonClassName ?? 'w-full')}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              'bg-input border border-input p-1! text-base rounded-md focus-within:ring-1 focus-within:ring-ring',
              isDraftInvalid && 'border-destructive focus-within:ring-destructive',
              buttonClassName ?? 'w-full flex justify-between items-center',
            )}
          >
            <div className={cn(calendarInput(), 'gap-2', inputClassName)}>
              <input
                ref={setInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                id={id}
                name={field?.name}
                aria-label={ariaLabelledBy ? undefined : DEFAULT_INPUT_LABEL}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
                aria-invalid={isInvalid || undefined}
                className="min-w-0 flex-1 bg-transparent p-0 text-sm outline-hidden placeholder:text-muted-foreground"
                placeholder={DATE_INPUT_PLACEHOLDER}
                value={displayText}
                onChange={handleInputChange}
                onFocus={(event) => {
                  selectOnMouseUpRef.current = true
                  event.target.select()
                }}
                onMouseUp={handleInputMouseUp}
                onBlur={() => {
                  selectOnMouseUpRef.current = false
                  commitDraft({ revertInvalid: true })
                  field?.onBlur()
                }}
                onKeyDown={handleInputKeyDown}
              />
              <div className="flex shrink-0 items-center gap-x-1">
                {showNowButton && (
                  <Button type="button" variant="link" className="text-xs text-blue-500" onMouseDown={keepInputFocus} onClick={handleNow}>
                    Now
                  </Button>
                )}
                {value && !required && (
                  <Button type="button" variant="icon" size="icon-xs" descriptiveTooltipText="Clear date" onMouseDown={keepInputFocus} onClick={handleClearDate}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <PopoverTrigger asChild>
                  <Button type="button" variant="icon" size="icon-xs" descriptiveTooltipText="Open calendar" onMouseDown={keepInputFocus}>
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </div>
            </div>
          </div>
        </PopoverAnchor>
      </div>
      <PopoverPortal>
        <PopoverContent ref={contentRef} className={calendarPopoverStyle()} align={align} side={side}>
          <Calendar
            mode="single"
            disabled={isDateDisabled}
            startMonth={startMonth}
            endMonth={endMonth}
            selected={value ?? undefined}
            defaultMonth={calendarMonth}
            onSelect={handleCalendarSelect}
            autoFocus
          />
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}

CalendarPopover.displayName = 'CalendarPopover'

export { CalendarPopover }
