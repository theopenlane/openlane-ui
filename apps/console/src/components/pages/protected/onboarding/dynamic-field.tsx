'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { sortByOrder } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'
import { BooleanField } from './fields/boolean-field'
import { CheckboxField } from './fields/checkbox-field'
import { MultiInputField } from './fields/multi-input-field'
import { MultiselectField } from './fields/multiselect-field'
import { FieldError, QuestionDescription, QuestionLabel } from './question-label'

export const DynamicQuestionField: React.FC<{ question: OnboardingQuestion }> = ({ question }) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  const error = errors[question.key]
  const watched = watch(question.key)

  switch (question.inputType) {
    case 'string':
      return (
        <div className="space-y-2">
          <QuestionLabel question={question} htmlFor={question.key} />
          <QuestionDescription text={question.description} />
          <Input id={question.key} type={question.format === 'email' ? 'email' : 'text'} {...register(question.key)} />
          <FieldError message={error?.message} />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <QuestionLabel question={question} htmlFor={question.key} />
          <QuestionDescription text={question.description} />
          <Select onValueChange={(next) => setValue(question.key, next, { shouldDirty: true, shouldValidate: true })} value={typeof watched === 'string' ? watched : ''}>
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
          <FieldError message={error?.message} />
        </div>
      )

    case 'multi-input':
      return <MultiInputField question={question} />

    case 'multiselect':
      return <MultiselectField question={question} />

    case 'boolean':
      return <BooleanField question={question} />

    case 'checkbox':
      return <CheckboxField question={question} />
  }
}
