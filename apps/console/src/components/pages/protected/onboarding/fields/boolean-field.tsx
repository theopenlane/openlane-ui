'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { cn } from '@repo/ui/lib/utils'
import { sortByOrder } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingQuestion, type OnboardingQuestionOption } from '@/lib/onboarding-questions/types'
import { FieldError, QuestionDescription, QuestionLabel } from '../question-label'

const DEFAULT_BOOLEAN_OPTIONS: OnboardingQuestionOption[] = [
  { value: 'true', label: 'Yes', hidden: false },
  { value: 'false', label: 'No', hidden: false },
]

export const BooleanField: React.FC<{ question: OnboardingQuestion }> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const watched = watch(question.key)
  const value = typeof watched === 'boolean' ? watched : undefined
  const error = formState.errors[question.key]
  const options = question.options && question.options.length > 0 ? sortByOrder(question.options) : DEFAULT_BOOLEAN_OPTIONS
  const isChoiceCards = options.some((option) => !!option.description)

  return (
    <div className={cn('space-y-3', isChoiceCards && 'border-t pt-6')}>
      <div className="space-y-1">
        <QuestionLabel question={question} />
        <QuestionDescription text={question.description} />
      </div>
      <RadioGroup
        value={value === undefined ? '' : String(value)}
        onValueChange={(next) => setValue(question.key, next === 'true', { shouldDirty: true, shouldValidate: true })}
        className={isChoiceCards ? 'grid gap-3' : 'flex flex-wrap gap-6'}
      >
        {options.map((option) => {
          const id = `${question.key}-${option.value}`

          return (
            <Label
              key={option.value}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer font-normal text-sm',
                isChoiceCards
                  ? 'items-start gap-4 rounded-lg border p-4 transition-colors hover:border-primary/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5'
                  : 'items-center gap-2',
              )}
            >
              <RadioGroupItem id={id} value={option.value} className={cn(isChoiceCards && 'mt-0.5')} />
              {isChoiceCards ? (
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{option.label}</span>
                  {option.description && <span className="text-muted-foreground">{option.description}</span>}
                </span>
              ) : (
                option.label
              )}
            </Label>
          )
        })}
      </RadioGroup>
      <FieldError message={error?.message} />
    </div>
  )
}
