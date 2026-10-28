'use client'

import React, { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { type UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import AcceptRiskDialog from '@/components/pages/protected/exposure/triage/accept-risk-dialog'
import { buildResponsibilityInlineUpdate } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useBulkUpdateFeedback } from '@/components/shared/crud-base/use-bulk-update-feedback'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useBulkEditVulnerability } from '@/lib/graphql-hooks/vulnerability'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { useVulnerabilityReviewer } from '../../../hooks/use-vulnerability-review'
import { VULNERABILITY_ASSIGNEE } from '../../../vulnerability-responsibilities'
import { buildRemediationTaskDefaults } from '../../../vulnerability-display'
import { ExposureAssetEnvironmentPopover } from './exposure-asset-environment-popover'

export type TSelectedReport = { id: string; isOpen: boolean; externalOwnerID?: string | null; hasAssetEnvironment: boolean }

type TExposureBulkActionsProps = {
  selected: TSelectedReport[]
  cveLabel: string
  hiddenCount: number
  onSettled: (remainingIds: string[]) => void
}

const ExposureBulkActions: React.FC<TExposureBulkActionsProps> = ({ selected, cveLabel, hiddenCount, onSettled }) => {
  const [isDismissOpen, setIsDismissOpen] = useState(false)
  const { data: session } = useSession()
  const userId = session?.user?.userId
  const { mutateAsync: bulkEdit, isPending } = useBulkEditVulnerability()
  const { dismissInput } = useVulnerabilityReviewer()
  const { notifyBulkUpdate } = useBulkUpdateFeedback()
  const { errorNotification } = useNotification()

  const selectedIds = useMemo(() => selected.map((report) => report.id), [selected])
  const openIds = useMemo(() => selected.filter((report) => report.isOpen).map((report) => report.id), [selected])
  const taskInitialValues = useMemo(() => buildRemediationTaskDefaults(cveLabel, userId), [cveLabel, userId])
  const taskInitialData = useMemo(() => ({ vulnerabilityIDs: selectedIds }), [selectedIds])

  const runBulkEdit = async (ids: string[], input: UpdateVulnerabilityInput): Promise<boolean> => {
    try {
      const { updateBulkVulnerability } = await bulkEdit({ ids, input })
      const succeeded = notifyBulkUpdate({
        requestedCount: ids.length,
        updatedIDs: updateBulkVulnerability.updatedIDs,
        notUpdatedIDs: updateBulkVulnerability.notUpdatedIDs,
        error: updateBulkVulnerability.error,
        singular: 'report',
      })
      onSettled(succeeded ? [] : (updateBulkVulnerability.notUpdatedIDs ?? ids))
      return succeeded
    } catch (error) {
      errorNotification({ title: 'Failed to update reports', description: parseErrorMessage(error) })
      return false
    }
  }

  const handleAssignToMe = () => {
    if (!userId) return
    void runBulkEdit(selectedIds, buildResponsibilityInlineUpdate(VULNERABILITY_ASSIGNEE.fieldBaseName, { type: 'user', value: userId }) as UpdateVulnerabilityInput)
  }

  const handleDismiss = async (reason: string, comment: string) => {
    if (await runBulkEdit(openIds, dismissInput(reason, comment))) setIsDismissOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2 shadow-lg">
      <span className="text-sm font-medium">
        {selected.length} selected
        {hiddenCount > 0 && <span className="font-normal text-muted-foreground"> · {hiddenCount} not shown</span>}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={!userId || isPending} onClick={handleAssignToMe}>
          Assign to me
        </Button>
        <ExposureAssetEnvironmentPopover reports={selected} disabled={isPending} onApply={(input) => runBulkEdit(selectedIds, input)} />
        <CreateTaskDialog
          trigger={
            <Button type="button" variant="secondary" disabled={isPending}>
              {selected.length > 1 ? 'One task for all' : 'Create task'}
            </Button>
          }
          initialValues={taskInitialValues}
          initialData={taskInitialData}
          defaultSelectedObject={ObjectTypeObjects.VULNERABILITY}
          hideObjectAssociation
          onSuccessWithId={() => onSettled([])}
        />
        <DisabledReasonTooltip reason={openIds.length === 0 ? 'Only open reports can be dismissed.' : undefined}>
          <Button type="button" variant="secondary" disabled={isPending || openIds.length === 0} onClick={() => setIsDismissOpen(true)}>
            {openIds.length < selected.length && openIds.length > 0 ? `Dismiss ${openIds.length} open` : 'Dismiss'}
          </Button>
        </DisabledReasonTooltip>
      </div>
      <AcceptRiskDialog
        isOpen={isDismissOpen}
        vulnerabilityName={`${pluralizeWithCount(openIds.length, 'report')} of ${cveLabel}`}
        isSubmitting={isPending}
        onClose={() => setIsDismissOpen(false)}
        onConfirm={handleDismiss}
      />
    </div>
  )
}

export default ExposureBulkActions
