'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDeleteProcedureMutation } from '@repo/codegen/src/schema'
import { UseQueryExecute } from 'urql'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type ProcedureActionsProps = {
  procedureId: string
  refetchProcedures: UseQueryExecute
}

const ICON_SIZE = 12

export const Actions = ({ procedureId: procedureId, refetchProcedures: refetchProcedures }: ProcedureActionsProps) => {
  const router = useRouter()
  const { actionIcon } = pageStyles()
  const { successNotification, errorNotification } = useNotification()

  const [_, deleteProcedure] = useDeleteProcedureMutation()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditProcedure = () => {
    router.push(`/procedures/${procedureId}/edit`)
  }

  const handleDeleteProcedure = async () => {
    const { error } = await deleteProcedure({ deleteProcedureId: procedureId })

    if (error) {
      errorNotification({ title: 'Error deleting procedure', gqlError: error })
      return
    }

    refetchProcedures()

    successNotification({
      title: 'Questionnaire deleted successfully',
    })
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleEditProcedure} className="cursor-pointer">
              <Edit width={ICON_SIZE} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 width={ICON_SIZE} /> Delete
            </DropdownMenuItem>
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
