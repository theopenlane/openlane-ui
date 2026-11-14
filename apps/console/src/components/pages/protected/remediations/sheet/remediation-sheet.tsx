'use client'

import React, { useRef } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@repo/ui/sheet'
import { useRemediation } from '@/lib/graphql-hooks/remediation'
import { useRetainedWhileOpen } from '@/hooks/useRetainedWhileOpen'
import { GenericDetailsSheetSkeleton } from '@/components/shared/crud-base/skeleton/details-sheet-skeleton'
import RemediationSheetBody, { type TRemediationCloseGuard } from './remediation-sheet-body'
import { type TRemediationContextRef } from './remediation-context'

type TRemediationSheetProps = {
  open: boolean
  remediationId?: string | null
  initialContext?: TRemediationContextRef
  onClose: () => void
  onCreated?: (remediationId: string) => void
}

type TCloseGuardRef = React.RefObject<TRemediationCloseGuard | null>

const RemediationDetail: React.FC<{ remediationId: string; onClose: () => void; closeGuardRef: TCloseGuardRef }> = ({ remediationId, onClose, closeGuardRef }) => {
  const { data, isLoading, isPlaceholderData, isError } = useRemediation(remediationId)
  const remediation = data?.remediation?.id === remediationId ? data.remediation : undefined

  if (remediation) {
    return <RemediationSheetBody key={remediation.id} remediation={remediation} onClose={onClose} closeGuardRef={closeGuardRef} />
  }

  if (isLoading || isPlaceholderData) {
    return (
      <>
        <SheetTitle className="sr-only">Loading remediation</SheetTitle>
        <GenericDetailsSheetSkeleton />
      </>
    )
  }

  return (
    <div className="py-16 text-center text-muted-foreground">
      <SheetTitle className="text-base font-normal">{isError ? 'Remediation not found.' : 'Remediation unavailable.'}</SheetTitle>
    </div>
  )
}

const RemediationSheet: React.FC<TRemediationSheetProps> = ({ open, remediationId, initialContext, onClose, onCreated }) => {
  const closeGuardRef = useRef<TRemediationCloseGuard | null>(null)
  const shownRemediationId = useRetainedWhileOpen(open, remediationId)
  const shownContext = useRetainedWhileOpen(open, initialContext)

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : closeGuardRef.current ? closeGuardRef.current(onClose) : onClose())}>
      <SheetContent minWidth="40vw" initialWidth="60vw" className="flex flex-col">
        {shownRemediationId ? (
          <RemediationDetail remediationId={shownRemediationId} onClose={onClose} closeGuardRef={closeGuardRef} />
        ) : (
          <RemediationSheetBody
            key={shownContext ? `${shownContext.type}-${shownContext.id}` : 'create'}
            initialContext={shownContext ?? undefined}
            onClose={onClose}
            onCreated={onCreated}
            closeGuardRef={closeGuardRef}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

export default RemediationSheet
