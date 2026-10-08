import { useState } from 'react'
import { DomainListEditor as Editor } from '@/components/shared/domain-list-editor/domain-list-editor'
import { isValidDomain } from '@/utils/strings'

export type ApprovalDomainListProps = {
  inputLabel: string
  domains: string[]
  disabled: boolean
  onChange: (domains: string[]) => void
}

export const DomainListEditor = ({ inputLabel, domains, disabled, onChange }: ApprovalDomainListProps) => {
  const [domain, setDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const addDomain = () => {
    if (disabled) {
      return
    }

    const trimmed = domain.trim().toLowerCase()
    if (!trimmed) {
      return
    }

    if (!isValidDomain(trimmed)) {
      setInputError(`"${trimmed}" is not a valid domain.`)
      return
    }

    if (domains.includes(trimmed)) {
      setInputError(`"${trimmed}" already exists.`)
      return
    }

    onChange([...domains, trimmed])
    setDomain('')
  }

  const removeDomain = (domainToRemove: string) => {
    if (disabled) {
      return
    }

    onChange(domains.filter((domain) => domain !== domainToRemove))
  }

  return (
    <Editor
      domains={domains}
      newDomain={domain}
      onNewDomainChange={(value) => {
        setDomain(value)
        if (inputError) {
          setInputError(null)
        }
      }}
      onAdd={addDomain}
      onRemove={removeDomain}
      error={inputError}
      emptyText="No domains yet."
      inputLabel={inputLabel}
      addLabel="Add Domain"
      addOnEnter
    />
  )
}
