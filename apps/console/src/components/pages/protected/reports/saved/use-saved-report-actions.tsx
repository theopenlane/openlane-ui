'use client'

import React, { useCallback, useState } from 'react'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { MoreVertical, Pencil, Share2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ReportReportVisibility } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { copyLinkMenuAction, deleteMenuAction } from '@/components/shared/crud-base/slideout-header'
import { MenuActionItem, orderMenuActions, type TMenuAction } from '@/components/shared/menu/menu-action-item'
import { useNotification } from '@/hooks/useNotification'
import { useRetainedWhileOpen } from '@/hooks/useRetainedWhileOpen'
import { canDelete, canEdit, isImpersonation } from '@/lib/authz/utils'
import { useDeleteReport, type TSavedReportRef } from '@/lib/graphql-hooks/report'
import { useAccountRolesMany } from '@/lib/query-hooks/permissions'
import { reportVisibilityOf, savedReportUrl } from '@/lib/report/saved-report'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import ShareReportSheet from './share-report-sheet'

type TReportManageAccess = { canEdit: boolean; canDelete: boolean }

export const useCopySavedReportLink = () => {
  const { successNotification } = useNotification()
  const [, copyToClipboard] = useCopyToClipboard()

  return useCallback(
    (id: string) => {
      copyToClipboard(savedReportUrl(id))
      successNotification({ title: 'Copied to clipboard', variant: 'success' })
    },
    [copyToClipboard, successNotification],
  )
}

type TUseSavedReportActionsArgs = {
  reportIds: string[]
  onEdit: (report: TSavedReportRef) => void
  onDeleted?: (id: string) => void
}

export const useSavedReportActions = ({ reportIds, onEdit, onDeleted }: TUseSavedReportActionsArgs) => {
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const copyLink = useCopySavedReportLink()
  const { data: rolesData } = useAccountRolesMany({ objectType: ObjectTypes.REPORT, ids: reportIds })
  const { mutateAsync: deleteReport } = useDeleteReport()
  const [shareTarget, setShareTarget] = useState<TSavedReportRef | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TSavedReportRef | null>(null)
  const retainedDeleteTarget = useRetainedWhileOpen(!!deleteTarget, deleteTarget)

  const accessFor = useCallback(
    (id: string): TReportManageAccess => {
      const roles = rolesData?.object_roles?.[id]

      return { canEdit: canEdit(roles, session), canDelete: !!isImpersonation(session) || canDelete(roles) }
    },
    [rolesData?.object_roles, session],
  )

  const menuActionsFor = useCallback(
    (report: TSavedReportRef): TMenuAction[] => {
      const access = accessFor(report.id)
      const isShared = reportVisibilityOf(report.visibility) !== ReportReportVisibility.PRIVATE
      const actions: (TMenuAction | false)[] = [
        access.canEdit && { key: 'share', label: 'Share', icon: <Share2 size={16} />, onClick: () => setShareTarget(report) },
        isShared && copyLinkMenuAction(() => copyLink(report.id)),
        access.canEdit && { key: 'edit', label: 'Edit', icon: <Pencil size={16} />, onClick: () => onEdit(report) },
        access.canDelete && deleteMenuAction(() => setDeleteTarget(report)),
      ]

      return orderMenuActions(actions.filter((action): action is TMenuAction => !!action))
    },
    [accessFor, copyLink, onEdit],
  )

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await deleteReport({ deleteReportId: deleteTarget.id })
      successNotification({ title: 'Report deleted', description: `"${deleteTarget.name}" was deleted.` })
      onDeleted?.(deleteTarget.id)
      setDeleteTarget(null)
    } catch (error) {
      errorNotification({ title: 'Could not delete report', description: parseErrorMessage(error) })
    }
  }

  const dialogs = (
    <>
      <ShareReportSheet report={shareTarget} onClose={() => setShareTarget(null)} />
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete report"
        description={`Are you sure you want to delete "${retainedDeleteTarget?.name ?? ''}"? Anyone it is shared with loses access. This action cannot be undone.`}
        confirmationText="Delete"
        confirmationTextVariant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )

  return { menuActionsFor, dialogs }
}

export const SavedReportMenu: React.FC<{ reportName: string; actions: TMenuAction[] }> = ({ reportName, actions }) => {
  if (actions.length === 0) return null

  return (
    <div role="presentation" onClick={(event) => event.stopPropagation()} onAuxClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="secondary" size="icon" aria-label={`Actions for ${reportName}`}>
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {actions.map((action) => (
            <MenuActionItem key={action.key} action={action} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
