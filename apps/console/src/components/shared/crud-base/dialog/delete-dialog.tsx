'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canDelete } from '@/lib/authz/utils.ts'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'

interface GenericDeleteDialogProps {
  entityId: string
  entityType: ObjectTypes
  onDelete: (id: string) => Promise<void>
}

export const GenericDeleteDialog: React.FC<GenericDeleteDialogProps> = ({ entityId, entityType, onDelete }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(entityType, entityId)
  const [isOpen, setIsOpen] = useState(false)

  const entityLabel = toHumanLabel(entityType)

  const handleDelete = async () => {
    if (!entityId) return

    try {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('id')
      router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
      await onDelete(entityId)
      successNotification({ title: `${entityLabel} deleted successfully.` })
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
      <Button icon={<Trash2 />} iconPosition="left" variant="secondary" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmationDialog
        title={`Delete ${entityLabel}`}
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        description={<>This action cannot be undone. This will permanently remove this {entityLabel.toLowerCase()} from the organization.</>}
      />
    </>
  )
}
