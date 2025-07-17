'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDeleteProgram, useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

export const ProgramSettingsDangerZone = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const [isDialogOpen, setDialogOpen] = useState(false)

  const { mutateAsync, isPending } = useDeleteProgram()
  const { data } = useGetProgramBasicInfo(programId, !isDeleting)
  const program = data?.program
  const { successNotification, errorNotification } = useNotification()

  const handleDelete = async () => {
    if (!programId) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Program ID not found in the URL.',
      })
      return
    }

    try {
      setIsDeleting(true)
      router.replace('/programs')
      await mutateAsync({ deleteProgramId: programId })
      successNotification({
        title: 'The program has been successfully deleted.',
      })
    } catch {
      errorNotification({
        title: 'Failed to Delete Program',
      })
    } finally {
      setDialogOpen(false)
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
      <section className="flex gap-14 border-t pt-6">
        <div className="w-48 shrink-0">
          <h3 className="font-normal text-xl mb-2">Danger Zone</h3>
        </div>

        <div className="space-y-6 w-full">
          {/* <div>
            <p className="text-base">
              Archiving a program will make it <strong>read-only</strong>. You can still view all content, but no changes or actions can be performed.
            </p>
            <Button variant="destructive" className="mt-2 h-8 !px-2">
              Archive
            </Button>
          </div> */}

          <div className="space-y-2">
            <p className="text-base">
              Proceed with caution, deleting a program is <strong>permanent and irreversible</strong>.
            </p>
            <Button variant="destructive" className="w-fit" onClick={() => setDialogOpen(true)} disabled={isPending}>
              {isPending ? 'Deleting... ' : 'Delete'}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
