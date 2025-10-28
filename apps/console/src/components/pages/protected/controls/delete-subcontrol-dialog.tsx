'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Trash2 } from 'lucide-react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useRouter } from 'next/navigation'
import { useDeleteSubcontrol } from '@/lib/graphql-hooks/subcontrol.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { useAccountRoles } from '@/lib/query-hooks/permissions'

const DeleteSubcontrolDialog: React.FC<{ subcontrolId: string; controlId: string; refCode: string }> = ({ subcontrolId, controlId, refCode }) => {
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(ObjectEnum.SUBCONTROL, subcontrolId)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const { mutateAsync: deleteSubcontrol } = useDeleteSubcontrol()

  const handleDelete = async () => {
    if (!subcontrolId) return

    try {
      await deleteSubcontrol({ deleteSubcontrolId: subcontrolId })
      successNotification({ title: `Subcontrol deleted successfully.` })
      router.push(`/controls/${controlId}`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsOpen(false)
    }
  }

  if (!canDelete(permission?.roles)) {
    return null
  }

  return (
    <>
      <Button type="button" variant="secondary" className="!p-1 h-8" onClick={() => setIsOpen(true)} aria-label="Delete subcontrol">
        <Trash2 size={16} strokeWidth={2} />
      </Button>
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        title={`Delete Subcontrol`}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{refCode}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default DeleteSubcontrolDialog
