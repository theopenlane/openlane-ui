'use client'

import { Button } from '@repo/ui/button'
import { Info, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useState } from 'react'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { useQueryClient } from '@tanstack/react-query'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useParams } from 'next/navigation'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

interface SetReadyForAuditorDialogProps {
  programStatus: ProgramProgramStatus
}

const SetReadyForAuditorDialog: React.FC<SetReadyForAuditorDialogProps> = ({ programStatus }: SetReadyForAuditorDialogProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: update } = useUpdateProgram()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const handleSetReadyForAuditor = async () => {
    if (!id) return
    await update({
      updateProgramId: id,
      input: {
        auditorReady: true,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['programs'] })
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={programStatus === ProgramProgramStatus.ARCHIVED} className="h-8! p-2!" variant="secondary" type="button" icon={<Pencil />} iconPosition="left">
          Ready for Auditor
        </Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[497px]">
        <DialogHeader>
          <DialogTitle>Set ready for auditor</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-md border border-border bg-input p-4 ">
          <Info className="mt-1" size={16} />
          <div className="text-sm">
            <p className="text-base ">What will happen?</p>
            <p>This program will be marked as &quot;Auditor ready&quot;</p>
          </div>
        </div>
        <DialogFooter className="mt-6 flex gap-2">
          <Button onClick={handleSetReadyForAuditor}>Set ready</Button>
          <CancelButton onClick={() => setOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetReadyForAuditorDialog
