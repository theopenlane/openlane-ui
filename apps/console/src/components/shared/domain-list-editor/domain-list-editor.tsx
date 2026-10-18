import React, { useRef } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'

type DomainListEditorProps = {
  domains: string[]
  newDomain?: string
  onNewDomainChange?: (value: string) => void
  onAdd?: () => void | Promise<void>
  emptyText?: string
  onRemove?: (domain: string) => void
  error?: string | null
  isPending?: boolean
  placeholder?: string
  inputLabel?: string
  addLabel?: string
}

export const DomainListEditor = ({
  domains,
  newDomain,
  onNewDomainChange,
  onAdd,
  emptyText,
  onRemove,
  error,
  isPending,
  placeholder = 'example.com',
  inputLabel = 'Domain',
  addLabel = 'Add',
}: DomainListEditorProps) => {
  const isInputEmpty = !newDomain?.trim()
  const canAdd = !isInputEmpty && !isPending
  const isAddingRef = useRef(false)

  const handleAdd = async () => {
    if (!onAdd || !canAdd || isAddingRef.current) return
    isAddingRef.current = true
    try {
      await onAdd()
    } finally {
      isAddingRef.current = false
    }
  }

  return (
    <div>
      {onAdd && (
        <div className="flex items-center gap-2">
          <Input
            variant="medium"
            aria-label={inputLabel}
            placeholder={placeholder}
            value={newDomain ?? ''}
            onChange={(e) => onNewDomainChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
              e.preventDefault()
              void handleAdd()
            }}
          />
          <DisabledReasonTooltip reason={isInputEmpty ? 'Enter a domain first.' : null}>
            <Button type="button" variant="secondary" icon={<Plus />} iconPosition="left" loading={isPending} disabled={!canAdd} onClick={() => void handleAdd()}>
              {addLabel}
            </Button>
          </DisabledReasonTooltip>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {domains.length === 0 && emptyText && <p className="text-sm text-muted-foreground">{emptyText}</p>}

      {domains.length > 0 && (
        <div className={cn('flex flex-wrap gap-2', onAdd && 'mt-4')}>
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
