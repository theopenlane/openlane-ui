'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDeleteInternalPolicyMutation } from '@repo/codegen/src/schema'
import { UseQueryExecute } from 'urql'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type PolicyActionsProps = {
  policyId: string
  refetchPolicies: UseQueryExecute
}

const ICON_SIZE = 12

export const Actions = ({ policyId: policyId, refetchPolicies: refetchPolicies }: PolicyActionsProps) => {
  const router = useRouter()
  const { actionIcon } = pageStyles()
  const { successNotification, errorNotification } = useNotification()

  const [_, deletePolicy] = useDeleteInternalPolicyMutation()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditPolicy = () => {
    router.push(`/policies/${policyId}/edit`)
  }

  const handleDeletePolicy = async () => {
    const { error } = await deletePolicy({ deleteInternalPolicyId: policyId })

    if (error) {
      errorNotification({ title: 'Error deleting policy', gqlError: error })
      return
    }

    refetchPolicies()

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
