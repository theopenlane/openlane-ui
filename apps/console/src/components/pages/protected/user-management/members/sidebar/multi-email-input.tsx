import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { type Tag } from 'emblor'
import { TagInput } from '@repo/ui/tag-input'
import { dedupeEmails, isDuplicateEmail, isValidEmail } from '@/lib/validators'

type TMultiEmailInputProps = {
  value: string[]
  onChange: (emails: string[]) => void
  error?: string
  disabled?: boolean
  onValidChange?: (isValid: boolean) => void
}

const DUPLICATE_EMAIL_MESSAGE = 'This email is already added.'
const INVALID_EMAIL_MESSAGE = 'Your email is invalid.'

const CARET_NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End'])

const preventTagNavigationHijack = (event: KeyboardEvent<HTMLDivElement>) => {
  if (CARET_NAVIGATION_KEYS.has(event.key)) {
    event.stopPropagation()
  }
}

export const MultiEmailInput = ({ value, onChange, error, disabled, onValidChange }: TMultiEmailInputProps) => {
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const tags = useMemo<Tag[]>(() => value.map((email) => ({ id: email, text: email })), [value])

  useEffect(() => {
    onValidChange?.(feedback === null)
  }, [feedback, onValidChange])

  const validateEmail = (raw: string): boolean => {
    const email = raw.trim()
    if (!email) {
      return false
    }

    if (!isValidEmail(email)) {
      setFeedback(INVALID_EMAIL_MESSAGE)
      return false
    }

    if (isDuplicateEmail(email, value)) {
      setFeedback(DUPLICATE_EMAIL_MESSAGE)
      return false
    }

    setFeedback(null)
    return true
  }

  const handleInputChange = (next: string) => {
    const email = next.trim()
    if (email && isDuplicateEmail(email, value)) {
      setFeedback(DUPLICATE_EMAIL_MESSAGE)
      return
    }
    if (feedback) {
      setFeedback(null)
    }
  }

  const message = feedback ?? error

  return (
    <div className="w-full" onKeyDownCapture={preventTagNavigationHijack}>
      <TagInput
        tags={tags}
        validateTag={validateEmail}
        setTags={(newTags) => {
          if (typeof newTags === 'function') {
            return
          }
          onChange(dedupeEmails(newTags.map((tag) => tag.text.trim())))
        }}
        addTagsOnBlur
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        inputProps={{ disabled }}
        onInputChange={handleInputChange}
      />
      {message && <p className="text-sm font-medium text-destructive mt-1 text-left">{message}</p>}
    </div>
  )
}

export default MultiEmailInput
