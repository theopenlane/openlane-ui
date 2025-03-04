'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useDeleteProcedure } from '@/lib/graphql-hooks/procedures'

type ProcedureActionsProps = {
  procedureId: string
}

const ICON_SIZE = 12

export const Actions = ({ procedureId: procedureId }: ProcedureActionsProps) => {
  const router = useRouter()
  const { actionIcon } = pageStyles()
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: deleteProcedure } = useDeleteProcedure()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditProcedure = () => {
    router.push(`/procedures/${procedureId}/edit`)
  }

  const handleDeleteProcedure = async () => {
    try {
      await deleteProcedure({ deleteProcedureId: procedureId })
      successNotification({
        title: 'Questionnaire deleted successfully',
      })
    } catch {
      errorNotification({ title: 'Error deleting procedure' }) //gqlError: error TODO: update notification
    }
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
