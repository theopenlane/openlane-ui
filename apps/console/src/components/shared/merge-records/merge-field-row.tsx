'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { Badge } from '@repo/ui/badge'
import { Check } from 'lucide-react'
import { MergeValueDisplay } from './merge-value-display'
import type { MergeSource, MergeArrayStrategy } from './types'
import type { ResolvedField } from './use-merge-resolution'

type Props<TRecord> = {
  resolved: ResolvedField<TRecord>
  onPickSource: (source: MergeSource) => void
  onToggleArrayStrategy?: (strategy: MergeArrayStrategy) => void
}

export const MergeFieldRow = <TRecord,>({ resolved, onPickSource, onToggleArrayStrategy }: Props<TRecord>) => {
  const { field, kind, primaryValue, secondaryValue, chosenSource, arrayStrategy } = resolved

  const isMergedArray = kind === 'merged-array' && arrayStrategy === 'union'
  const isMergedMap = kind === 'merged-map'
  const primarySelected = !isMergedArray && !isMergedMap && chosenSource === 'primary'
  const secondarySelected = !isMergedArray && !isMergedMap && chosenSource === 'secondary'

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.label}</span>
          {kind === 'auto-secondary' && (
            <Badge variant="outline" className="text-xs">
              Auto-filled from Secondary
            </Badge>
          )}
          {kind === 'conflict' && (
            <Badge variant="outline" className="text-xs">
              Conflict
            </Badge>
          )}
          {isMergedArray && (
            <Badge variant="outline" className="text-xs">
              Merged
            </Badge>
          )}
          {isMergedMap && (
            <Badge variant="outline" className="text-xs">
              Shallow merged
            </Badge>
          )}
        </div>
        {kind === 'merged-array' && onToggleArrayStrategy && (
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onToggleArrayStrategy('union')}
              className={cn('px-2 py-0.5 rounded border', arrayStrategy === 'union' ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30')}
            >
              Union
            </button>
            <button
              type="button"
              onClick={() => onToggleArrayStrategy('choose')}
              className={cn('px-2 py-0.5 rounded border', arrayStrategy === 'choose' ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30')}
            >
              Choose one
            </button>
          </div>
        )}
      </div>

      {isMergedMap ? (
        <div className="space-y-2">
          <MergeValueDisplay field={field} value={resolved.resolvedValue} />
          <p className="text-xs text-muted-foreground">Primary keys take precedence; secondary fills any missing keys.</p>
        </div>
      ) : isMergedArray ? (
        <div className="space-y-2">
          <MergeValueDisplay field={field} value={resolved.resolvedValue} />
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <div className="mb-1">Primary</div>
              <MergeValueDisplay field={field} value={primaryValue} />
            </div>
            <div>
              <div className="mb-1">Secondary</div>
              <MergeValueDisplay field={field} value={secondaryValue} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPickSource('primary')}
            className={cn('text-left rounded border px-3 py-2 transition-colors', primarySelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted-foreground/20 hover:bg-muted/30')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Primary</span>
              {primarySelected && <Check size={14} className="text-primary" />}
            </div>
            <MergeValueDisplay field={field} value={primaryValue} />
          </button>
          <button
            type="button"
            onClick={() => onPickSource('secondary')}
            className={cn(
              'text-left rounded border px-3 py-2 transition-colors',
              secondarySelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted-foreground/20 hover:bg-muted/30',
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Secondary</span>
              {secondarySelected && <Check size={14} className="text-primary" />}
            </div>
            <MergeValueDisplay field={field} value={secondaryValue} />
          </button>
        </div>
      )}
    </div>
  )
}
