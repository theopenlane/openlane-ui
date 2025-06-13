'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteTask } from '@/lib/graphql-hooks/tasks'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useRouter, useSearchParams } from 'next/navigation'

const DeleteTaskDialog: React.FC<{ taskName: string; taskId: string }> = ({ taskName, taskId }) => {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.TASK, taskId)
  const [isOpen, setIsOpen] = useState(false)

  const { mutateAsync: deleteTask } = useDeleteTask()

  const handleDelete = async () => {
    if (!taskId) return

    try {
      await deleteTask({ deleteTaskId: taskId })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({ title: `Task deleted successfully.` })
    } catch (error) {
      errorNotification({ title: 'Failed to delete task.' })
    } finally {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('id')
      router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
      setIsOpen(false)
    }
  }

  if (!canDelete(permission?.roles)) {
    return null
  }

  return (
    <>
      <Button icon={<Trash2 />} iconPosition="left" variant="outline" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmationDialog
        title={`Delete Task`}
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{taskName}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default DeleteTaskDialog
