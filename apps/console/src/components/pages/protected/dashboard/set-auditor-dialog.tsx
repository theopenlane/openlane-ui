'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import MessageBox from '@repo/ui/message-box'

const setAuditorSchema = z.object({
  auditorName: z.string().min(1, 'Name is required'),
  auditorEmail: z.string().email('Invalid email address'),
  auditFirm: z.string().optional(),
  auditorReadComments: z.boolean().default(false),
  auditorWriteComments: z.boolean().default(false),
  auditorReady: z.boolean().default(false),
})

type SetAuditorFormValues = z.infer<typeof setAuditorSchema>

export const SetAuditorDialog = () => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { mutateAsync: update } = useUpdateProgram()

  const form = useForm<SetAuditorFormValues>({
    resolver: zodResolver(setAuditorSchema),
    defaultValues: {
      auditorName: '',
      auditorEmail: '',
      auditFirm: '',
      auditorReadComments: false,
      auditorWriteComments: false,
      auditorReady: false,
    },
  })

  const onSubmit = async (values: SetAuditorFormValues) => {
    if (!id) return
    await update({
      updateProgramId: id,
      input: {
        auditor: values.auditorName,
        auditorEmail: values.auditorEmail,
        auditFirm: values.auditFirm,
        auditorReadComments: values.auditorReadComments,
        auditorWriteComments: values.auditorWriteComments,
        auditorReady: values.auditorReady,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['programs'] })
    setOpen(false)
  }

  const errorMessages = Object.values(form.formState.errors).map((error) => error?.message) as string[]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">Set auditor</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set auditor</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4 w-80">
          {errorMessages.length > 0 && <MessageBox className="p-4 ml-1" message={errorMessages.join(', ')} variant="error" />}
          <Input {...form.register('auditorName')} placeholder="Name" />
          <Input {...form.register('auditorEmail')} placeholder="Email" />
          <Input {...form.register('auditFirm')} placeholder="Firm" />

          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm">Auditor can read comments</span>
              <Switch checked={form.watch('auditorReadComments')} onCheckedChange={(checked) => form.setValue('auditorReadComments', checked)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Auditor can write comments</span>
              <Switch checked={form.watch('auditorWriteComments')} onCheckedChange={(checked) => form.setValue('auditorWriteComments', checked)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Auditor ready</span>
              <Switch checked={form.watch('auditorReady')} onCheckedChange={(checked) => form.setValue('auditorReady', checked)} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button onClick={form.handleSubmit(onSubmit)}>Save</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
