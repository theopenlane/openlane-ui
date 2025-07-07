'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Trash2 } from 'lucide-react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useRouter } from 'next/navigation'
import { useDeleteSubcontrol } from '@/lib/graphql-hooks/subcontrol.ts'

const DeleteSubcontrolDialog: React.FC<{ subcontrolId: string; controlId: string; refCode: string }> = ({ subcontrolId, controlId, refCode }) => {
  const { successNotification, errorNotification } = useNotification()
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.SUBCONTROL, subcontrolId!)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const { mutateAsync: deleteSubcontrol } = useDeleteSubcontrol()

  const handleDelete = async () => {
    if (!subcontrolId) return

    try {
      await deleteSubcontrol({ deleteSubcontrolId: subcontrolId })
      successNotification({ title: `Subcontrol deleted successfully.` })
      router.push(`/controls/${controlId}`)
    } catch {
      errorNotification({ title: 'Failed to delete Subcontrol.' })
    } finally {
      setIsOpen(false)
    }
  }

  if (!canDelete(permission?.roles)) {
    return null
  }

  return (
    <>
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsOpen(true)}>
        <Trash2 size={16} strokeWidth={2} />
        <span>Delete</span>
      </div>
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
