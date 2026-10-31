'use client'

import React, { useEffect, useRef, useState } from 'react'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { useFindingSheetConfig } from './hooks/use-finding-sheet-config'
import { useFindingComments, useGetFindingAssociations } from '@/lib/graphql-hooks/finding'
import CommentsSection from '@/components/shared/comments/comments-section'
import { Button } from '@repo/ui/button'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import RemediationSheetBody, { type TRemediationCloseGuard } from '../remediations/sheet/remediation-sheet-body'
import { useSheetNavigation } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useRouter } from 'next/navigation'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'

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
  const router = useRouter()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canCreateRemediation = hasPermission(orgPermission?.roles, AccessEnum.CanCreateRemediation, session)
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

  if (!canCreateRemediation) {
    return (
      <Button type="button" icon={<ExternalLink size={14} />} iconPosition="left" variant="outline" size="md" onClick={() => router.push('/exposure/remediations')}>
        View Remediations
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
  const remediationCloseGuardRef = useRef<TRemediationCloseGuard | null>(null)

  const riskScoresAction = entityId && !isTrackingRemediation ? <FindingRemediationButton entityId={entityId} onTrack={() => setIsTrackingRemediation(true)} /> : undefined

  const sheetConfig = useFindingSheetConfig(entityId, false, riskScoresAction)
  const comments = useFindingComments(entityId)

  const handleStopTracking = () => setIsTrackingRemediation(false)
  const handleCloseSheet = () => {
    handleStopTracking()
    onClose()
  }
  const handleClose = () => {
    if (isTrackingRemediation && remediationCloseGuardRef.current) {
      remediationCloseGuardRef.current(handleCloseSheet)
      return
    }
    handleCloseSheet()
  }

  useEffect(() => {
    setIsTrackingRemediation(false)
  }, [entityId])

  return (
    <GenericDetailsSheet
      onClose={handleClose}
      basePath="/exposure/findings"
      {...sheetConfig}
      extraContent={entityId ? <CommentsSection key={entityId} {...comments} /> : undefined}
      overrideContent={
        isTrackingRemediation && entityId ? (
          <RemediationSheetBody
            initialContext={{ type: ObjectAssociationNodeEnum.FINDING, id: entityId }}
            initialInstructions={sheetConfig.data?.recommendedActions ?? undefined}
            onClose={handleCloseSheet}
            onBack={handleStopTracking}
            closeGuardRef={remediationCloseGuardRef}
          />
        ) : undefined
      }
      overrideHeader={isTrackingRemediation && entityId ? <></> : undefined}
    />
  )
}

export default ViewFindingSheet
