'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type ProcedureActionsProps = {
  procedureId: string
  // refetchProcedures: UseQueryExecute
}

const ICON_SIZE = 12

export const Actions = ({
  procedureId: procedureId,
  // refetchProcedures: refetchProcedures,
}: ProcedureActionsProps) => {
  const router = useRouter()
  const { actionIcon } = pageStyles()
  const { toast } = useToast()

  // const [ _, deleteTemplate] = useDeleteProcedureMutation()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditProcedure = () => {
    router.push(`/policies-and-procedures/editor?id=${procedureId}`)
  }

  const handleDeleteProcedure = async () => {
    // const response = await deleteProcedure({ deleteProcedureId: procedureId })

    // if (response.error) {
    //   toast({
    //     title: 'There was a problem deleting the procedure, please try again',
    //     variant: 'destructive',
    //   })
    // }

    // if (response.data) {
    toast({
      title: 'Questionnaire deleted successfully',
      variant: 'success',
    })
    // refetchProcedures({
    //   requestProcedure: 'network-only',
    // })
    // }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleEditProcedure}>
              <Edit width={ICON_SIZE} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 width={ICON_SIZE} /> Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone, this will permanently remove the procedure from the organization.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="filled"
                onClick={handleDeleteProcedure}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteProcedure()
                  }
                }}
              >
                Delete Procedure
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
