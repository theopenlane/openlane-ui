'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { HelpCircle, X } from 'lucide-react'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { sortByOrder } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'

const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// A hoverable (?) icon for extra context that doesn't need to be visible by default
export const HelpTooltip: React.FC<{ text: string }> = ({ text }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle size={12} className="shrink-0 cursor-help text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[23rem]">
        <p className="font-normal whitespace-pre-line">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

interface DynamicQuestionFieldProps {
  question: OnboardingQuestion
}

const QuestionLabel: React.FC<{ question: OnboardingQuestion; htmlFor?: string }> = ({ question, htmlFor }) => {
  if (!question.label) return null

  return (
    <Label htmlFor={htmlFor} className="font-semibold text-sm">
      <span className="inline-flex items-center gap-1.5">
        {question.label}
        {question.required && <span className="text-red-500">*</span>}
        {question.helpText && <HelpTooltip text={question.helpText} />}
      </span>
    </Label>
  )
}

export const DynamicQuestionField: React.FC<DynamicQuestionFieldProps> = ({ question }) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  const error = errors[question.key]
  const value = watch(question.key)

  const label = <QuestionLabel question={question} htmlFor={question.key} />

  switch (question.inputType) {
    case 'string':
      return (
        <div className="space-y-2">
          {label}
          {question.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{question.description}</p>}
          <Input id={question.key} type={question.format === 'email' ? 'email' : 'text'} {...register(question.key)} />
          {typeof error?.message === 'string' && <p className="text-red-500 text-sm">{error.message}</p>}
        </div>
      )

    case 'multi-input':
      return <MultiInputField question={question} />

    case 'select':
      return (
        <div className="space-y-2">
          {label}
          {question.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{question.description}</p>}
          <Select onValueChange={(next) => setValue(question.key, next, { shouldDirty: true, shouldValidate: true })} value={(value as string) || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {sortByOrder(question.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {typeof error?.message === 'string' && <p className="text-red-500 text-sm">{error.message}</p>}
        </div>
      )

    case 'multiselect':
      return <MultiselectField question={question} />

    case 'boolean':
      return <BooleanField question={question} />

    case 'checkbox':
      return <CheckboxField question={question} />
  }
}

const MultiInputField: React.FC<DynamicQuestionFieldProps> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const [draft, setDraft] = useState('')
  const [invalidDraft, setInvalidDraft] = useState(false)
  const items = (watch(question.key) as string[] | undefined) ?? []
  const error = formState.errors[question.key]

  const addItem = () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    if (question.key === 'company_domains' && !DOMAIN_REGEX.test(trimmed)) {
      setInvalidDraft(true)
      return
    }

    if (!items.includes(trimmed)) {
      setValue(question.key, [...items, trimmed], { shouldDirty: true, shouldValidate: true })
    }
    setDraft('')
    setInvalidDraft(false)
  }

  const removeItem = (item: string) => {
    setValue(
      question.key,
      items.filter((existing) => existing !== item),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  return (
    <div className="space-y-2">
      <QuestionLabel question={question} htmlFor={question.key} />
      {question.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{question.description}</p>}
      <div className="flex flex-wrap items-center gap-2 border rounded-md p-2">
        {items.map((item) => (
          <Badge key={item} className="flex items-center gap-1">
            {item}
            <button type="button" onClick={() => removeItem(item)} className="ml-1 bg-transparent">
              <X size={12} />
            </button>
          </Badge>
        ))}
        <Input
          id={question.key}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setInvalidDraft(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              addItem()
            }
          }}
          onBlur={addItem}
          className="h-auto flex-1 min-w-[180px] border-none p-0 shadow-none focus-visible:ring-0"
        />
      </div>
      {invalidDraft && <p className="text-red-500 text-sm">Invalid domain format. Example: acme.com</p>}
      {typeof error?.message === 'string' && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  )
}

// Options shown before "See all" is clicked: the first COLLAPSED_VISIBLE_COUNT by order, plus
// the "other" option (if present) pinned in as the last visible slot regardless of its own order
const COLLAPSED_VISIBLE_COUNT = 5

const MultiselectField: React.FC<DynamicQuestionFieldProps> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const selected = (watch(question.key) as string[] | undefined) ?? []
  const error = formState.errors[question.key]
  const showIcons = question.key === 'frameworks'
  const [showAll, setShowAll] = useState(false)

  const toggle = (optionValue: string, checked: boolean) => {
    const next = checked ? [...new Set([...selected, optionValue])] : selected.filter((item) => item !== optionValue)
    setValue(question.key, next, { shouldDirty: true, shouldValidate: true })
  }

  const sortedOptions = sortByOrder(question.options ?? [])
  const isCollapsible = sortedOptions.length > COLLAPSED_VISIBLE_COUNT + 1
  const otherOption = sortedOptions.find((option) => option.value === 'other')
  const collapsedOptions = otherOption
    ? [...sortedOptions.filter((option) => option.value !== 'other').slice(0, COLLAPSED_VISIBLE_COUNT), otherOption]
    : sortedOptions.slice(0, COLLAPSED_VISIBLE_COUNT + 1)
  const visibleOptions = isCollapsible && !showAll ? collapsedOptions : sortedOptions

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <QuestionLabel question={question} />
        {question.description && <p className="text-xs text-muted-foreground whitespace-pre-line">{question.description}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {visibleOptions.map((option) => {
          const id = `${question.key}-${option.value}`
          const checked = selected.includes(option.value)

          const card = (
            <Label
              htmlFor={id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border bg-background p-3 transition-all duration-150 [&_[role=checkbox]]:border-slate-400 [&_[role=checkbox]]:bg-white [&_[role=checkbox]]:shadow-sm dark:[&_[role=checkbox]]:border-border dark:[&_[role=checkbox]]:bg-background [&_[role=checkbox][data-state=checked]]:border-primary [&_[role=checkbox][data-state=checked]]:bg-primary ${
                checked ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:-translate-y-0.5 hover:border-primary/60 hover:bg-accent/50'
              }`}
            >
              <Checkbox id={id} checked={checked} onCheckedChange={(next) => toggle(option.value, next === true)} />
              {showIcons && <StandardsIconMapper shortName={option.label} height={64} width={64} />}
              <span className="w-full font-medium">{option.label}</span>
            </Label>
          )

          if (!option.description) {
            return <div key={option.value}>{card}</div>
          }

          return (
            <TooltipProvider key={option.value} disableHoverableContent={true}>
              <Tooltip>
                <TooltipTrigger asChild>{card}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="whitespace-pre-line">{option.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
      {isCollapsible && (
        <div className="flex justify-end">
          <Button type="button" variant="secondaryOutline" className="text-sm text-brand" onClick={() => setShowAll((current) => !current)}>
            {showAll ? 'Show less' : 'See all'}
          </Button>
        </div>
      )}
      {typeof error?.message === 'string' && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  )
}

const DEFAULT_BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

const BooleanField: React.FC<DynamicQuestionFieldProps> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const value = watch(question.key) as boolean | undefined
  const error = formState.errors[question.key]
  const options = question.options && question.options.length > 0 ? sortByOrder(question.options) : DEFAULT_BOOLEAN_OPTIONS

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <QuestionLabel question={question} />
        {question.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{question.description}</p>}
      </div>
      <RadioGroup
        value={value === undefined ? '' : String(value)}
        onValueChange={(next) => setValue(question.key, next === 'true', { shouldDirty: true, shouldValidate: true })}
        className="flex flex-wrap gap-6"
      >
        {options.map((option) => (
          <Label key={option.value} htmlFor={`${question.key}-${option.value}`} className="flex cursor-pointer items-center gap-2 font-normal text-sm">
            <RadioGroupItem id={`${question.key}-${option.value}`} value={option.value} />
            {option.label}
          </Label>
        ))}
      </RadioGroup>
      {typeof error?.message === 'string' && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  )
}

const CheckboxField: React.FC<DynamicQuestionFieldProps> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const value = watch(question.key) as boolean | undefined
  const error = formState.errors[question.key]

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <QuestionLabel question={question} />
        {question.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{question.description}</p>}
      </div>
      <Label htmlFor={question.key} className="flex cursor-pointer items-center gap-2 font-normal text-sm">
        <Checkbox id={question.key} checked={value ?? false} onCheckedChange={(next) => setValue(question.key, next === true, { shouldDirty: true, shouldValidate: true })} />
        {question.checkboxLabel ?? question.label}
      </Label>
      {typeof error?.message === 'string' && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  )
}
