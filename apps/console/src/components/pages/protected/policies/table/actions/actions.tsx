'use client'

import { Edit, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDeleteInternalPolicy } from '@/lib/graphql-hooks/policy'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'

type PolicyActionsProps = {
  policyId: string
}

const ICON_SIZE = 16

export const Actions = ({ policyId }: PolicyActionsProps) => {
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.POLICY, policyId)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)

  const { mutateAsync: deletePolicy } = useDeleteInternalPolicy()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditPolicy = () => {
    router.push(`/policies/${policyId}/edit`)
  }

  const handleDeletePolicy = async () => {
    try {
      await deletePolicy({ deleteInternalPolicyId: policyId })
      successNotification({ title: 'Policy deleted successfully' })
    } catch {
      errorNotification({ title: 'Error deleting policy' })
    }
  }

  if (!deleteAllowed && !editAllowed) return null

  return (
    <>
      <div className="flex gap-2 items-center">
        {editAllowed && <Edit size={ICON_SIZE} onClick={handleEditPolicy} />}
        {deleteAllowed && (
          <Trash2
            size={ICON_SIZE}
            onClick={() => {
              setIsDeleteDialogOpen(true)
            }}
          />
        )}
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeletePolicy}
        description="This action cannot be undone. This will permanently remove the policy from the organization."
      />
    </>
  )
}
