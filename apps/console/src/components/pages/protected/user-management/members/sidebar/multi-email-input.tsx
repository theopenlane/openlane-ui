import { useMemo, useState } from 'react'
import { type Tag } from 'emblor'
import { TagInput } from '@repo/ui/tag-input'
import { isValidEmail } from '@/lib/validators'

type TMultiEmailInputProps = {
  value: string[]
  onChange: (emails: string[]) => void
  error?: string
  disabled?: boolean
}

const dedupe = (emails: string[]): string[] => {
  const seen = new Set<string>()
  return emails.filter((email) => {
    const key = email.toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export const MultiEmailInput = ({ value, onChange, error, disabled }: TMultiEmailInputProps) => {
  const [currentValue, setCurrentValue] = useState('')
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const tags = useMemo<Tag[]>(() => value.map((email) => ({ id: email, text: email })), [value])

  const commit = (raw: string): boolean => {
    const email = raw.trim()
    if (!email) {
      return false
    }

    if (!isValidEmail(email)) {
      setFeedback('Your email is invalid.')
      return false
    }

    if (value.some((existing) => existing.toLowerCase() === email.toLowerCase())) {
      setFeedback('This email is already added.')
      return false
    }

    setFeedback(null)
    onChange([...value, email])
    return true
  }

  const message = feedback ?? error

  return (
    <div className="w-full">
      <TagInput
        tags={tags}
        validateTag={(tag) => commit(tag)}
        setTags={(newTags) => {
          if (typeof newTags === 'function') {
            return
          }
          // emblor drives removals (Backspace / X) through here; additions are handled
          // by validateTag's commit(). Re-sync from the authoritative tag list.
          onChange(dedupe(newTags.map((tag) => tag.text)))
        }}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        inputProps={{ value: currentValue, disabled }}
        onInputChange={(next) => {
          setCurrentValue(next)
          if (feedback) {
            setFeedback(null)
          }
        }}
        onBlur={() => {
          if (commit(currentValue)) {
            setCurrentValue('')
          }
        }}
      />
      {message && <p className="text-sm font-medium text-destructive mt-1 text-left">{message}</p>}
    </div>
  )
}

export default MultiEmailInput
