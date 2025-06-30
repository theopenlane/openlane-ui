'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import MessageBox from '@repo/ui/message-box'
import { Label } from '@repo/ui/label'
import { Info, InfoIcon } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'

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

      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[497px]">
        <DialogHeader>
          <DialogTitle>Set auditor</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-md border border-border bg-input-background p-4 ">
          <Info className="mt-1" size={16} />
          <div className="text-sm">
            <p className="text-base ">Need help finding an auditor?</p>
            <p>
              Head over to our{' '}
              <a href="#" className="text-blue-500 text-sm">
                partners list
              </a>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {errorMessages.length > 0 && <MessageBox className="p-4 ml-1" message={errorMessages.join(', ')} variant="error" />}
          <div className="flex flex-col gap-2">
            <div>
              <Label htmlFor="auditFirm">Firm</Label>
              <SystemTooltip
                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                content={
                  <p>
                    Enter the name of the firm responsible for conducting your audit or certification. This helps ensure accurate record-keeping, allows you to manage audit partners, and provides
                    access to audit documents when needed (e.g., SecureSphere Compliance").
                  </p>
                }
              />
            </div>
            <Input id="auditFirm" {...form.register('auditFirm')} placeholder="SecureSphere Compliance" />
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <Label htmlFor="auditorName">Name</Label>
              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Enter the name of your primary contact at the audit firm (e.g. Amy Shields).</p>} />
            </div>
            <Input id="auditorName" {...form.register('auditorName')} placeholder="Amy Shields" />
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <Label htmlFor="auditorEmail">Email</Label>
              <SystemTooltip
                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                content={<p>Enter the email address of your primary contact at the audit firm (e.g. amy.shields@securesphere.io).</p>}
              />
            </div>
            <Input id="auditorEmail" {...form.register('auditorEmail')} placeholder="amy.shields@securesphere.io" />
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
