'use client'

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useDeleteTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { useSession } from 'next-auth/react'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

interface Props {
  subprocessorId: string
  subprocessorName: string
}

export const DeleteTrustCenterSubprocessorCell = ({ subprocessorId, subprocessorName }: Props) => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  // core's TrustCenterSubprocessor policy guards deletes with CheckEditAccess,
  // so removal needs edit rather than can_delete_trust_center_subprocessor.
  const isDeleteAllowed = canEdit(orgPermission?.roles, session)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { mutateAsync: deleteSubprocessor } = useDeleteTrustCenterSubprocessor()
  const { successNotification, errorNotification } = useNotification()

  const handleDelete = async () => {
    try {
      await deleteSubprocessor({ deleteTrustCenterSubprocessorId: subprocessorId })

      successNotification({
        title: 'Subprocessor deleted',
      })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  if (!isDeleteAllowed) {
    return null
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteDialogOpen(true)
          }}
          variant="secondary"
        >
          <Trash2 />
        </Button>
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Subprocessor"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{subprocessorName}</b> from your trust center.
          </>
        }
      />
    </>
  )
}
