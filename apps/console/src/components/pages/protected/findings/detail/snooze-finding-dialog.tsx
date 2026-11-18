'use client'

import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type FindingDetailNode, invalidateFindingCommentQueries, useUpdateFinding } from '@/lib/graphql-hooks/finding'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { useNotification } from '@/hooks/useNotification'
import { formatDate } from '@/utils/date'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'
import { buildSnoozeCommentHtml } from '../../exposure/detail/snooze/build-snooze-comment'
import { ExposureSnoozeDialog, ExposureSnoozeForm } from '../../exposure/detail/snooze/exposure-snooze-dialog'
import { getSnoozedRemediationSla } from '../../exposure/detail/snooze/snooze-options'

type TSnoozeFindingDialogProps = {
  isOpen: boolean
  finding: FindingDetailNode
  findingName: string
  onClose: () => void
}

type TSnoozeFindingRequest = { until: Date; comment: string }

const SnoozeFindingDialog: React.FC<TSnoozeFindingDialogProps> = ({ isOpen, finding, findingName, onClose }) => {
  const queryClient = useQueryClient()
  const converter = usePlateEditor()
  const { successNotification } = useNotification()
  const { mutateAsync: updateFinding } = useUpdateFinding()
  const { slaDefinitionsNodes, status: slaDefinitionsStatus } = useSlaDefinitionsWithFilter({})

  const { mutateAsync: snooze, isPending } = useMutation<boolean, unknown, TSnoozeFindingRequest>({
    mutationFn: async ({ until, comment }) => {
      const remediationSLA = getSnoozedRemediationSla(finding, until, getVulnerabilityDueDate(finding, slaDefinitionsNodes).slaDays)
      const commentHtml = await buildSnoozeCommentHtml(until, comment, converter)
      if (remediationSLA !== null || commentHtml) {
        await updateFinding({ updateFindingId: finding.id, input: { ...(remediationSLA !== null && { remediationSLA }), ...(commentHtml && { addComment: { text: commentHtml } }) } })
      }
      return remediationSLA !== null
    },
    onSuccess: (_result, { comment }) => {
      if (comment.trim()) invalidateFindingCommentQueries(queryClient)
    },
  })

  const handleSnooze = async (until: Date, comment: string) => {
    const snoozed = await snooze({ until, comment })
    successNotification({ title: 'Finding snoozed', description: snoozed ? `Due ${formatDate(until.toISOString())}.` : 'This finding was already due later.' })
    onClose()
  }

  return (
    <ExposureSnoozeDialog isOpen={isOpen} isPending={isPending} onClose={onClose}>
      <ExposureSnoozeForm
        entityLabel="finding"
        itemName={findingName}
        item={finding}
        slaDefinitions={slaDefinitionsNodes}
        slaDefinitionsStatus={slaDefinitionsStatus}
        isPending={isPending}
        onSnooze={handleSnooze}
        onClose={onClose}
      />
    </ExposureSnoozeDialog>
  )
}

export default SnoozeFindingDialog
