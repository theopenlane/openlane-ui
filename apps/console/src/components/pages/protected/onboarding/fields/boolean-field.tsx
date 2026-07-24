'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { sortByOrder } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'
import { FieldError, QuestionDescription, QuestionLabel } from '../question-label'

const DEFAULT_BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

export const BooleanField: React.FC<{ question: OnboardingQuestion }> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const watched = watch(question.key)
  const value = typeof watched === 'boolean' ? watched : undefined
  const error = formState.errors[question.key]
  const options = question.options && question.options.length > 0 ? sortByOrder(question.options) : DEFAULT_BOOLEAN_OPTIONS

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <QuestionLabel question={question} />
        <QuestionDescription text={question.description} />
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
      <FieldError message={error?.message} />
    </div>
  )
}
