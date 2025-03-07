'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useDeleteInternalPolicy } from '@/lib/graphql-hooks/policy'

type PolicyActionsProps = {
  policyId: string
}

const ICON_SIZE = 12

export const Actions = ({ policyId: policyId }: PolicyActionsProps) => {
  const router = useRouter()
  const { actionIcon } = pageStyles()
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: deletePolicy } = useDeleteInternalPolicy()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditPolicy = () => {
    router.push(`/policies/${policyId}/edit`)
  }

  const handleDeletePolicy = async () => {
    try {
      await deletePolicy({ deleteInternalPolicyId: policyId })
      successNotification({
        title: 'Questionnaire deleted successfully',
      })
    } catch (error) {
      errorNotification({ title: 'Error deleting policy' })
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
            <DropdownMenuItem onSelect={handleEditPolicy} className="cursor-pointer">
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
        onConfirm={handleDeletePolicy}
        description="This action cannot be undone, this will permanently remove the policy from the organization."
      />
    </>
  )
}
