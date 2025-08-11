'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Trash2 } from 'lucide-react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useDeleteControl } from '@/lib/graphql-hooks/controls.ts'
import { useRouter } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const DeleteControlDialog: React.FC<{ controlId: string; refCode: string }> = ({ controlId, refCode }) => {
  const { successNotification, errorNotification } = useNotification()
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.CONTROL, controlId!)
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
      <div className="flex items-center space-x-2 cursor-pointer w-5" onClick={() => setIsOpen(true)}>
        <Trash2 size={16} strokeWidth={2} aria-label="Delete control" />
      </div>
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
