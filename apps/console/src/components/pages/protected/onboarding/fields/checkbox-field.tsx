'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'
import { FieldError, QuestionDescription, QuestionLabel } from '../question-label'

export const CheckboxField: React.FC<{ question: OnboardingQuestion }> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const watched = watch(question.key)
  const value = typeof watched === 'boolean' ? watched : false
  const error = formState.errors[question.key]

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <QuestionLabel question={question} />
        <QuestionDescription text={question.description} />
      </div>
      <Label htmlFor={question.key} className="flex cursor-pointer items-center gap-2 font-normal text-sm">
        <Checkbox id={question.key} checked={value} onCheckedChange={(next) => setValue(question.key, next === true, { shouldDirty: true, shouldValidate: true })} />
        {question.checkboxLabel ?? question.label}
      </Label>
      <FieldError message={error?.message} />
    </div>
  )
}
