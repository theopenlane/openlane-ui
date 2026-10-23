import { useState } from 'react'
import { DomainListEditor } from '@/components/shared/domain-list-editor/domain-list-editor'
import { isValidDomain } from '@/utils/strings'
import { toHostname } from '@/utils/normalizeUrl'

export type ApprovalDomainListProps = {
  inputLabel: string
  domains: string[]
  readOnly: boolean
  isSaving: boolean
  onChange: (domains: string[]) => void
}

export const ApprovalDomainList = ({ inputLabel, domains, readOnly, isSaving, onChange }: ApprovalDomainListProps) => {
  const [domain, setDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const addDomain = () => {
    const raw = domain.trim()
    if (!raw) {
      return
    }

    const candidate = toHostname(raw)
    if (!candidate || !isValidDomain(candidate)) {
      setInputError(`"${raw}" is not a valid domain.`)
      return
    }

    if (domains.includes(candidate)) {
      setInputError(`"${candidate}" already exists.`)
      return
    }

    onChange([...domains, candidate])
    setDomain('')
  }

  const removeDomain = (domainToRemove: string) => {
    onChange(domains.filter((domain) => domain !== domainToRemove))
  }

  return (
    <DomainListEditor
      domains={domains}
      newDomain={domain}
      onNewDomainChange={(value) => {
        setDomain(value)
        if (inputError) {
          setInputError(null)
        }
      }}
      inputLabel={inputLabel}
      onAdd={readOnly ? undefined : addDomain}
      onRemove={readOnly ? undefined : removeDomain}
      error={inputError}
      emptyText="No domains yet."
      addLabel="Add Domain"
      isPending={isSaving}
    />
  )
}
