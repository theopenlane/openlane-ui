'use client'

import React, { useState } from 'react'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { useFindingSheetConfig } from './hooks/use-finding-sheet-config'
import { Button } from '@repo/ui/button'
import { ShieldCheck } from 'lucide-react'
import { TrackRemediationForm, TrackRemediationHeader } from '../remediations/track-remediation-inline'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewFindingSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const [isTrackingRemediation, setIsTrackingRemediation] = useState(false)
  const [isRemediationPending, setIsRemediationPending] = useState(false)

  const sheetConfig = useFindingSheetConfig(entityId)

  const handleStartTracking = () => setIsTrackingRemediation(true)
  const handleStopTracking = () => setIsTrackingRemediation(false)
  const handleCloseAfterCreate = () => {
    setIsTrackingRemediation(false)
    onClose()
  }

  return (
    <GenericDetailsSheet
      onClose={onClose}
      basePath="/exposure/findings"
      {...sheetConfig}
      extraHeaderActions={
        entityId && !isTrackingRemediation ? (
          <Button icon={<ShieldCheck size={16} />} iconPosition="left" variant="primary" onClick={handleStartTracking}>
            Track Remediation
          </Button>
        ) : undefined
      }
      overrideContent={
        isTrackingRemediation && entityId ? <TrackRemediationForm entityId={entityId} entityType="finding" onClose={handleCloseAfterCreate} onPendingChange={setIsRemediationPending} /> : undefined
      }
      overrideHeader={isTrackingRemediation ? <TrackRemediationHeader onBack={handleStopTracking} isPending={isRemediationPending} /> : undefined}
    />
  )
}

export default ViewFindingSheet
