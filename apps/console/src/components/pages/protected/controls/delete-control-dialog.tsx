'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Trash2 } from 'lucide-react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useDeleteControl } from '@/lib/graphql-hooks/controls.ts'
import { useRouter } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { useAccountRoles } from '@/lib/query-hooks/permissions'

const DeleteControlDialog: React.FC<{ controlId: string; refCode: string }> = ({ controlId, refCode }) => {
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(ObjectEnum.CONTROL, controlId)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const { mutateAsync: deleteControl } = useDeleteControl()
  const handleDelete = async () => {
    if (!controlId) return

    try {
      router.push('/controls')
      await deleteControl({ deleteControlId: controlId })
      successNotification({ title: `Control deleted successfully.` })
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
      <Button type="button" variant="outline" className="!p-1 h-8 bg-card" onClick={() => setIsOpen(true)} aria-label="Delete control">
        <Trash2 size={16} strokeWidth={2} />
      </Button>

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        title={`Delete Control`}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{refCode}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default DeleteControlDialog
