'use client'

import { Edit, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDeleteProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'

type ProcedureActionsProps = {
  procedureId: string
}

const ICON_SIZE = 16

export const Actions = ({ procedureId }: ProcedureActionsProps) => {
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.PROCEDURE, procedureId)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)

  const { mutateAsync: deleteProcedure } = useDeleteProcedure()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditProcedure = () => {
    router.push(`/procedures/${procedureId}/edit`)
  }

  const handleDeleteProcedure = async () => {
    try {
      await deleteProcedure({ deleteProcedureId: procedureId })
      successNotification({ title: 'Procedure deleted successfully' })
    } catch {
      errorNotification({ title: 'Error deleting procedure' })
    }
  }

  if (!deleteAllowed && !editAllowed) return null

  return (
    <>
      <div className="flex gap-2 items-center">
        {editAllowed && (
          <Edit
            size={ICON_SIZE}
            onClick={(e) => {
              e.stopPropagation()
              handleEditProcedure()
            }}
            className="cursor-pointer"
          />
        )}
        {deleteAllowed && (
          <Trash2
            size={ICON_SIZE}
            onClick={(e) => {
              e.stopPropagation()
              setIsDeleteDialogOpen(true)
            }}
            className="cursor-pointer"
          />
        )}
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProcedure}
        description="This action cannot be undone. This will permanently remove the procedure from the organization."
      />
    </>
  )
}
