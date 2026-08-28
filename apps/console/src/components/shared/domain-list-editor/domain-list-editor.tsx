import React from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Plus, Trash2 } from 'lucide-react'

type DomainListEditorProps = {
  domains: string[]
  newDomain: string
  onNewDomainChange: (value: string) => void
  onAdd?: () => void
  onRemove?: (domain: string) => void
  error?: string | null
  isPending?: boolean
  placeholder?: string
  inputLabel?: string
  addLabel?: string
  addOnEnter?: boolean
}

export const DomainListEditor = ({
  domains,
  newDomain,
  onNewDomainChange,
  onAdd,
  onRemove,
  error,
  isPending,
  placeholder = 'example.com',
  inputLabel = 'Domain',
  addLabel = 'Add',
  addOnEnter = false,
}: DomainListEditorProps) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          variant="medium"
          aria-label={inputLabel}
          placeholder={placeholder}
          value={newDomain}
          onChange={(e) => onNewDomainChange(e.target.value)}
          onKeyDown={
            addOnEnter
              ? (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAdd?.()
                  }
                }
              : undefined
          }
        />
        {onAdd && (
          <Button type="button" variant="secondary" icon={<Plus />} iconPosition="left" loading={isPending} onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {domains.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {domains.map((domain) => (
            <div key={domain} className="flex items-center gap-1 bg-btn-secondary px-2 py-0.5 rounded-sm border border-muted text-sm font-mono">
              {domain}
              {onRemove && (
                <button type="button" aria-label={`Remove ${domain}`} disabled={isPending} onClick={() => onRemove(domain)} className="ml-1">
                  <Trash2 size={12} className="text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
