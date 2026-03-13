'use client'

import React from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { useGetAllEvidences, useDeleteEvidence } from '@/lib/graphql-hooks/evidence'
import { useUpdateFileCategoryType } from '@/lib/graphql-hooks/entity'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface UnmarkEvidenceDialogProps {
  fileId: string
  fileName: string
  onClose: () => void
}

const UnmarkEvidenceDialog: React.FC<UnmarkEvidenceDialogProps> = ({ fileId, fileName, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteEvidence } = useDeleteEvidence()
  const { mutateAsync: updateFileCategoryType } = useUpdateFileCategoryType()
  const { data: evidencesData } = useGetAllEvidences({
    hasFilesWith: [{ id: fileId }],
  })

  const evidences = evidencesData?.evidences?.edges?.map((e) => e?.node).filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? []

  const handleConfirm = async () => {
    try {
      await Promise.all(evidences.map((evidence) => deleteEvidence({ deleteEvidenceId: evidence.id })))

      await updateFileCategoryType({
        updateFileId: fileId,
        input: { clearCategoryType: true },
      })

      successNotification({
        title: 'Evidence removed',
        description: `Evidence for "${fileName}" has been deleted.`,
      })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const evidenceNames = evidences.map((e) => e.name).join(', ')

  return (
    <ConfirmationDialog
      open
      onOpenChange={(open) => !open && onClose()}
      onConfirm={handleConfirm}
      title="Remove Evidence"
      description={<>This will delete the evidence {evidenceNames ? <b>{evidenceNames}</b> : `associated with "${fileName}"`}. The file itself will not be deleted.</>}
    />
  )
}

export default UnmarkEvidenceDialog
