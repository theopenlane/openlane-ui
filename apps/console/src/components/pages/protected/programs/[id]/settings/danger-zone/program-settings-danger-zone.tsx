'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { useDeleteProgram, useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/program'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const ProgramSettingsDangerZone = () => {
  const { id } = useParams<{ id: string }>()
  const { data: permission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const editAllowed = canEdit(permission?.roles)
  const deleteAllowed = canDelete(permission?.roles)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const router = useRouter()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isUnArchiveDialogOpen, setIsUnArchiveDialogOpen] = useState(false)
  const { mutateAsync: updateProgram, isPending: isArchivePending } = useUpdateProgram()
  const { mutateAsync, isPending } = useDeleteProgram()
  const { data, refetch } = useGetProgramBasicInfo(id, !isDeleting)
  const program = data?.program
  const { successNotification, errorNotification } = useNotification()

  const handleDelete = async () => {
    if (!id) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Program ID not found in the URL.',
      })
      return
    }

    try {
      setIsDeleting(true)
      router.replace('/programs')
      await mutateAsync({ deleteProgramId: id })
      successNotification({
        title: 'The program has been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setDialogOpen(false)
    }
  }

  const handleArchive = async () => {
    if (!id) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Program ID not found in the URL.',
      })
      return
    }
    try {
      await updateProgram({ updateProgramId: id, input: { status: ProgramProgramStatus.ARCHIVED } })
      successNotification({
        title: 'The program has been successfully archived.',
      })
      await refetch()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsArchiveDialogOpen(false)
    }
  }

  const handleUnArchive = async () => {
    if (!id) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Program ID not found in the URL.',
      })
      return
    }
    try {
      await updateProgram({ updateProgramId: id, input: { status: ProgramProgramStatus.IN_PROGRESS } })
      successNotification({
        title: 'The program has been successfully unarchived.',
      })
      await refetch()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsUnArchiveDialogOpen(false)
    }
  }

  return (
    <>
      <ConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleDelete}
        title={`Delete Program ${program?.name}?`}
        description={
          <>
            This action cannot be undone. This will permanently delete <b>{program?.name}</b>.
          </>
        }
        confirmationText="Delete"
        confirmationTextVariant="destructive"
        showInput={true}
      />
      {
        <ConfirmationDialog
          open={isArchiveDialogOpen}
          onOpenChange={setIsArchiveDialogOpen}
          onConfirm={handleArchive}
          title={`Archive Program ${program?.name}?`}
          description={
            <>
              This will archive <b>{program?.name}</b>.
            </>
          }
          confirmationText="Archive"
          confirmationTextVariant="destructive"
        />
      }
      <ConfirmationDialog
        open={isUnArchiveDialogOpen}
        onOpenChange={setIsUnArchiveDialogOpen}
        onConfirm={handleUnArchive}
        title={`Unarchive Program ${program?.name}?`}
        description={
          <>
            This will unarchive <b>{program?.name}</b>.
          </>
        }
        confirmationText="Unarchive"
        confirmationTextVariant="filled"
      />
      {(editAllowed || deleteAllowed) && (
        <section className="flex gap-14 border-t pt-6">
          <div className="w-48 shrink-0">
            <h3 className="font-normal text-xl mb-2">Danger Zone</h3>
          </div>

          <div className="space-y-6 w-full">
            {editAllowed && program?.status === ProgramProgramStatus.ARCHIVED ? (
              <>
                <div className="space-y-2">
                  <p className="text-base">Unarchive a program</p>
                  <Button variant="destructive" className="w-fit" onClick={() => setIsUnArchiveDialogOpen(true)} disabled={isPending}>
                    {isArchivePending ? 'Unarchiving... ' : 'Unarchive'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {editAllowed && (
                  <div className="space-y-2">
                    <p className="text-base">
                      Archiving will lock this program so it&#39;s <strong>read-only</strong>. Don&#39;t worry - you can always unarchive it to make updates.
                    </p>
                    <Button variant="destructive" className="w-fit" onClick={() => setIsArchiveDialogOpen(true)} disabled={isPending}>
                      {isArchivePending ? 'Archiving... ' : 'Archive'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {deleteAllowed && (
              <div className="space-y-2">
                <p className="text-base">
                  Proceed with caution, deleting a program is <strong>permanent and irreversible</strong>.
                </p>
                <Button variant="destructive" className="w-fit" onClick={() => setDialogOpen(true)} disabled={isPending}>
                  {isPending ? 'Deleting... ' : 'Delete'}
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}
