'use client'

import React, { useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ReviewReviewStatus } from '@repo/codegen/src/schema'
import EvidenceCreateSheet from '@/components/pages/protected/evidence/evidence-create-sheet'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData'
import CreateReviewSheet from '@/components/pages/protected/reviews/common/create-review-sheet'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useNotification } from '@/hooks/useNotification'
import { useGetAssetAssociations } from '@/lib/graphql-hooks/asset'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useCreateReview } from '@/lib/graphql-hooks/review'
import { isImpersonation } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getAssetTitle, type AssetDetailNode } from '../asset-display'
import { SetAssetAssociationDialog } from '../set-asset-association-dialog'
import { type TAssetDialog } from './asset-quick-actions'
import { type TExposureItem } from './tabs/exposure/exposure-items'
import { LinkExposureDialog } from './tabs/exposure/link-exposure-dialog'

const CONTROL_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL]
const EVIDENCE_OBJECT_TYPES = [ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.SCAN, ObjectTypeObjects.TASK]

type TAssetDialogsProps = {
  asset: AssetDetailNode
  exposure: TExposureItem[]
  dialog: TAssetDialog | null
  onClose: () => void
}

const AssetDialogs: React.FC<TAssetDialogsProps> = ({ asset, exposure, dialog, onClose }) => {
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createReview, isPending: isCreatingReview } = useCreateReview()
  const { data: associationsData } = useGetAssetAssociations(asset.id)
  const title = getAssetTitle(asset)
  const isMarkingReviewedRef = useRef(false)

  const controls = useMemo(() => getNodes(associationsData?.asset?.controls), [associationsData])
  const subcontrols = useMemo(() => getNodes(associationsData?.asset?.subcontrols), [associationsData])
  const evidenceFormData = useMemo<TFormEvidenceData>(
    () => ({
      displayID: title,
      controlRefCodes: controls.map(({ refCode }) => refCode),
      subcontrolRefCodes: subcontrols.map(({ refCode }) => refCode),
      referenceFramework: Object.fromEntries(controls.map(({ id, referenceFramework }) => [id, referenceFramework ?? ''])),
      objectAssociations: { controlIDs: controls.map(({ id }) => id), subcontrolIDs: subcontrols.map(({ id }) => id) },
    }),
    [title, controls, subcontrols],
  )
  const evidenceControls = useMemo(
    () => [
      ...controls.map(({ id, refCode, referenceFramework }) => ({ __typename: 'Control', id, refCode, referenceFramework })),
      ...subcontrols.map(({ id, refCode }) => ({ __typename: 'Subcontrol', id, refCode })),
    ],
    [controls, subcontrols],
  )

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  const handleMarkReviewed = async () => {
    if (isMarkingReviewedRef.current) return
    isMarkingReviewedRef.current = true
    const now = new Date().toISOString()
    const reviewerID = isImpersonation(session) ? undefined : session?.user?.userId
    try {
      await createReview({ input: { title: `Asset review: ${title}`, status: ReviewReviewStatus.COMPLETED, reviewedAt: now, reviewerID, assetIDs: [asset.id] } })
      successNotification({ title: 'Asset marked as reviewed' })
      onClose()
    } catch (error) {
      errorNotification({ title: 'Failed to mark asset as reviewed', description: parseErrorMessage(error) })
    } finally {
      isMarkingReviewedRef.current = false
    }
  }

  return (
    <>
      {dialog === 'upload-evidence' && associationsData && (
        <EvidenceCreateSheet
          open
          onOpenChange={handleOpenChange}
          formData={evidenceFormData}
          controlParam={evidenceControls}
          allowedObjectTypes={EVIDENCE_OBJECT_TYPES}
          onEvidenceCreateSuccess={onClose}
        />
      )}
      <SetAssetAssociationDialog
        assetId={asset.id}
        defaultSelectedObject={ObjectTypeObjects.CONTROL}
        allowedObjectTypes={CONTROL_OBJECT_TYPES}
        open={dialog === 'map-control'}
        onOpenChange={handleOpenChange}
      />
      <LinkExposureDialog assetId={asset.id} items={exposure} open={dialog === 'link-exposure'} onOpenChange={handleOpenChange} />
      <ConfirmationDialog
        open={dialog === 'mark-reviewed'}
        onOpenChange={handleOpenChange}
        onConfirm={handleMarkReviewed}
        closeOnConfirm={false}
        loading={isCreatingReview}
        title="Mark as reviewed"
        description={
          <>
            This records a completed review of <b>{title}</b> dated today.
          </>
        }
        confirmationText="Mark Reviewed"
      />
      {dialog === 'add-review' && <CreateReviewSheet assetId={asset.id} onClose={onClose} />}
    </>
  )
}

export default AssetDialogs
