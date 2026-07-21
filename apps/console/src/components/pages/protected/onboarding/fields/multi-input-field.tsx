'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Input } from '@repo/ui/input'
import { X } from 'lucide-react'
import { DOMAIN_REGEX } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingQuestion } from '@/lib/onboarding-questions/types'
import { FieldError, QuestionDescription, QuestionLabel } from '../question-label'

export const MultiInputField: React.FC<{ question: OnboardingQuestion }> = ({ question }) => {
  const { setValue, watch, formState } = useFormContext()
  const [draft, setDraft] = useState('')
  const [invalidDraft, setInvalidDraft] = useState(false)
  const watched = watch(question.key)
  const items = Array.isArray(watched) ? watched.filter((item): item is string => typeof item === 'string') : []
  const error = formState.errors[question.key]
  const requiresDomain = question.format === 'domain'

  const addItem = () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    if (requiresDomain && !DOMAIN_REGEX.test(trimmed)) {
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
      <QuestionDescription text={question.description} />
      <div className="flex flex-wrap items-center gap-2 border rounded-md p-2">
        {items.map((item) => (
          <Badge key={item} className="flex items-center gap-1">
            {item}
            <button type="button" onClick={() => removeItem(item)} className="ml-1 bg-transparent" aria-label={`Remove ${item}`}>
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
          className="h-auto flex-1 min-w-[180px] border-none !px-1 !py-0 shadow-none focus-visible:ring-0"
        />
      </div>
      {invalidDraft && <p className="text-red-500 text-sm">Invalid domain format. Example: acme.com</p>}
      <FieldError message={error?.message} />
    </div>
  )
}
