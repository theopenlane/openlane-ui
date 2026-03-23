'use client'

import React, { useState } from 'react'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { useFindingSheetConfig } from './hooks/use-finding-sheet-config'
import { useGetFindingAssociations } from '@/lib/graphql-hooks/finding'
import { Button } from '@repo/ui/button'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import { TrackRemediationForm, TrackRemediationHeader } from '../remediations/track-remediation-inline'
import { useSheetNavigation } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'

type Props = {
  entityId: string | null
  onClose: () => void
}

type RemediationButtonProps = {
  entityId: string
  onTrack: () => void
}

const FindingRemediationButton: React.FC<RemediationButtonProps> = ({ entityId, onTrack }) => {
  const sheetNav = useSheetNavigation()
  const { data } = useGetFindingAssociations(entityId)
  const firstRemediationId = data?.finding?.remediations?.edges?.[0]?.node?.id

  if (firstRemediationId) {
    return (
      <Button
        type="button"
        icon={<ExternalLink size={14} />}
        iconPosition="left"
        variant="outline"
        size="md"
        onClick={() => sheetNav?.openSheet(firstRemediationId, ObjectAssociationNodeEnum.REMEDIATION)}
      >
        Open Remediation
      </Button>
    )
  }

  return (
    <Button type="button" icon={<ShieldCheck size={14} />} iconPosition="left" variant="primary" size="md" onClick={onTrack}>
      Track Remediation
    </Button>
  )
}

const ViewFindingSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const [isTrackingRemediation, setIsTrackingRemediation] = useState(false)
  const [isRemediationPending, setIsRemediationPending] = useState(false)
  const [trackingDefaultTitle, setTrackingDefaultTitle] = useState<string | undefined>(undefined)

  const riskScoresAction = entityId && !isTrackingRemediation ? <FindingRemediationButton entityId={entityId} onTrack={handleStartTracking} /> : undefined

  const sheetConfig = useFindingSheetConfig(entityId, false, riskScoresAction)

  function handleStartTracking() {
    setTrackingDefaultTitle(`${sheetConfig.data?.displayName ?? sheetConfig.data?.displayID ?? ''} Remediation`.trim() || undefined)
    setIsTrackingRemediation(true)
  }
  const handleStopTracking = () => {
    setIsTrackingRemediation(false)
    setTrackingDefaultTitle(undefined)
  }
  const handleCloseAfterCreate = () => {
    setIsTrackingRemediation(false)
  }

  return (
    <GenericDetailsSheet
      onClose={onClose}
      basePath="/exposure/findings"
      {...sheetConfig}
      overrideContent={
        isTrackingRemediation && entityId ? (
          <TrackRemediationForm entityId={entityId} entityType="finding" onClose={handleCloseAfterCreate} onPendingChange={setIsRemediationPending} defaultTitle={trackingDefaultTitle} />
        ) : undefined
      }
      overrideHeader={isTrackingRemediation ? <TrackRemediationHeader onBack={handleStopTracking} isPending={isRemediationPending} /> : undefined}
    />
  )
}

export default ViewFindingSheet
