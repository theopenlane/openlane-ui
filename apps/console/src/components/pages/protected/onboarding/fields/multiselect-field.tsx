'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { sortByOrder } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'
import { FieldError, QuestionDescription, QuestionLabel } from '../question-label'

const COLLAPSED_VISIBLE_COUNT = 5
const OTHER_OPTION_VALUE = 'other'
const FRAMEWORKS_QUESTION_KEY = 'frameworks'

export const MultiselectField: React.FC<{ question: OnboardingQuestion }> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const watched = watch(question.key)
  const selected = Array.isArray(watched) ? watched.filter((item): item is string => typeof item === 'string') : []
  const error = formState.errors[question.key]
  const showIcons = question.key === FRAMEWORKS_QUESTION_KEY
  const [showAll, setShowAll] = useState(false)

  const toggle = (optionValue: string, checked: boolean) => {
    const next = checked ? [...new Set([...selected, optionValue])] : selected.filter((item) => item !== optionValue)
    setValue(question.key, next, { shouldDirty: true, shouldValidate: true })
  }

  const sortedOptions = sortByOrder(question.options ?? [])
  const isCollapsible = sortedOptions.length > COLLAPSED_VISIBLE_COUNT + 1
  const otherOption = sortedOptions.find((option) => option.value === OTHER_OPTION_VALUE)
  const collapsedOptions = otherOption
    ? [...sortedOptions.filter((option) => option.value !== OTHER_OPTION_VALUE).slice(0, COLLAPSED_VISIBLE_COUNT), otherOption]
    : sortedOptions.slice(0, COLLAPSED_VISIBLE_COUNT + 1)
  const visibleOptions = isCollapsible && !showAll ? collapsedOptions : sortedOptions

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <QuestionLabel question={question} />
        <QuestionDescription text={question.description} className="text-xs" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {visibleOptions.map((option) => {
          const id = `${question.key}-${option.value}`
          const checked = selected.includes(option.value)

          const card = (
            <Label
              htmlFor={id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border bg-background p-3 transition-all duration-150 ${
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
          <Button type="button" variant="secondaryOutline" className="text-sm text-primary" onClick={() => setShowAll((current) => !current)}>
            {showAll ? 'Show less' : 'See all'}
          </Button>
        </div>
      )}
      <FieldError message={error?.message} />
    </div>
  )
}
