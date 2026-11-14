'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { ReadOnlyField } from '@/components/shared/read-only-field/read-only-field'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { getSeverityStyle } from '@/utils/severity'
import { CollapsiblePanel } from './collapsible-panel'
import { remediationContextTypeLabel, type TRemediationContext } from './remediation-context'

type TRemediationContextPanelProps = {
  context?: TRemediationContext
  isLoading: boolean
  isUnavailable?: boolean
  selector?: React.ReactNode
}

const ContextSummary: React.FC<{ context: TRemediationContext }> = ({ context }) => {
  const { convertToReadOnly } = usePlateEditor()
  const [showDescription, setShowDescription] = useState(false)
  const Icon = ObjectAssociationMap[context.type].icon
  const hasDescription = !isPlateValueEmpty(context.description)
  const description = useMemo(() => (showDescription && context.description ? convertToReadOnly(context.description) : null), [showDescription, context.description, convertToReadOnly])
  const iconStyle = context.level ? getSeverityStyle(context.level) : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', !iconStyle?.color && 'bg-muted text-muted-foreground')} style={iconStyle}>
          <Icon size={20} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium break-words">{context.heading}</span>
          <span className="text-sm text-muted-foreground">{remediationContextTypeLabel(context.type)}</span>
        </div>
        <SeverityChip severity={context.level} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {context.details.map((detail) => (
          <ReadOnlyField key={detail.label} label={detail.label}>
            {detail.value}
          </ReadOnlyField>
        ))}
      </div>

      {hasDescription && (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="link" className="w-fit text-blue-500" aria-expanded={showDescription} onClick={() => setShowDescription((open) => !open)}>
            {showDescription ? 'Hide full description' : 'See full description'}
            <ChevronDown size={14} className={cn('transition-transform', showDescription && 'rotate-180')} />
          </Button>
          {description && <div className="text-sm whitespace-pre-wrap break-words">{description}</div>}
        </div>
      )}
    </div>
  )
}

const ContextSummarySkeleton = () => (
  <div role="status" aria-live="polite" aria-label="Loading context" className="flex items-start gap-3">
    <Skeleton height={40} width={40} />
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton height={16} className="w-full max-w-[240px] rounded-md" />
      <Skeleton height={14} className="w-full max-w-[120px] rounded-md" />
    </div>
  </div>
)

const RemediationContextPanel: React.FC<TRemediationContextPanelProps> = ({ context, isLoading, isUnavailable, selector }) => (
  <CollapsiblePanel title="Context">
    {selector}
    {isLoading ? (
      <ContextSummarySkeleton />
    ) : context ? (
      <ContextSummary context={context} />
    ) : isUnavailable ? (
      <p className="text-sm text-muted-foreground">The linked issue could not be loaded. It may have been deleted, or you may not have access to it.</p>
    ) : null}
  </CollapsiblePanel>
)

export default RemediationContextPanel
