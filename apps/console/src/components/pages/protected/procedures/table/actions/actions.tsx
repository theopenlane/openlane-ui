'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { pageStyles } from '@/components/pages/protected/procedures/page.styles.tsx'
import { useDeleteProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'

type ProcedureActionsProps = {
  procedureId: string
}

const ICON_SIZE = 12

export const Actions = ({ procedureId: procedureId }: ProcedureActionsProps) => {
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.PROCEDURE, procedureId)
  const router = useRouter()
  const { actionIcon } = pageStyles()
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
      successNotification({
        title: 'Procedure deleted successfully',
      })
    } catch (error) {
      errorNotification({ title: 'Error deleting procedure' })
    }
  }

  if (!deleteAllowed && !editAllowed) {
    return
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            {editAllowed && (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.stopPropagation()
                  handleEditProcedure()
                }}
                className="cursor-pointer"
              >
                <Edit width={ICON_SIZE} /> Edit
              </DropdownMenuItem>
            )}
            {deleteAllowed && (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.stopPropagation()
                  setIsDeleteDialogOpen(true)
                }}
                className="cursor-pointer"
              >
                <Trash2 width={ICON_SIZE} /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProcedure}
        description="This action cannot be undone, this will permanently remove the procedure from the organization."
      />
    </>
  )
}
