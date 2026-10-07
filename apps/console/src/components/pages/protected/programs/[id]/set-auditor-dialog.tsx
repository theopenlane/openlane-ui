'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/program'
import { useParams } from 'next/navigation'
import MessageBox from '@repo/ui/message-box'
import { Label } from '@repo/ui/label'
import { InfoIcon } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { useNotification } from '@/hooks/useNotification'
import { isValidEmail } from '@/lib/validators'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { AUDITOR_URL } from '@/constants'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Callout } from '@/components/shared/callout/callout'
import { useDirtyInput } from '@/hooks/useDirtyInput'
import { type UpdateProgramInput } from '@repo/codegen/src/schema'
import { AUDITOR_UPDATE_FIELDS, setAuditorSchema, toAuditorFormValues, type SetAuditorFormValues } from './auditor-update-fields'

export const SetAuditorDialog = () => {
  const { id } = useParams<{ id: string }>()
  const [open, setOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { data: programData } = useGetProgramBasicInfo(id)

  const { mutateAsync: update } = useUpdateProgram()

  const form = useForm<SetAuditorFormValues>({
    resolver: zodResolver(setAuditorSchema),
    defaultValues: toAuditorFormValues(undefined),
  })

  const buildDirtyInput = useDirtyInput(form)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(toAuditorFormValues(programData?.program))
    }
    setOpen(nextOpen)
  }

  const onSubmit = async (values: SetAuditorFormValues) => {
    if (!id) return
    if (values.auditorEmail && values.auditorEmail !== '' && !isValidEmail(values.auditorEmail)) {
      errorNotification({
        title: 'Wrong email format',
      })
      return
    }
    try {
      const input = await buildDirtyInput<UpdateProgramInput>(values, AUDITOR_UPDATE_FIELDS)

      if (Object.keys(input).length === 0) {
        form.reset()
        setOpen(false)
        return
      }

      await update({ updateProgramId: id, input })
      successNotification({ title: 'Auditor successfully added/edited' })
      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const errorMessages = Object.values(form.formState.errors).map((error) => error?.message) as string[]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-fit">Set auditor</Button>
      </DialogTrigger>

      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-124.25">
        <DialogHeader>
          <DialogTitle>Set auditor</DialogTitle>
        </DialogHeader>
        <Callout variant="recommendation" title="Auditor Recommendations">
          If you need help finding an auditor, check out our{' '}
          <a href={AUDITOR_URL} className="underline" target="_blank" rel="noopener noreferrer">
            audit partner list
          </a>{' '}
          or reach out to support for personalized recommendations
        </Callout>
        <div className="flex flex-col gap-4 mt-4">
          {errorMessages.length > 0 && <MessageBox className="p-4 ml-1" message={errorMessages.join(', ')} variant="error" />}
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Label htmlFor="auditFirm">Firm</Label>
              <SystemTooltip
                icon={<InfoIcon size={14} className="mx-1" />}
                content={
                  <p>
                    Enter the name of the firm responsible for conducting your audit or certification. This helps ensure accurate record-keeping, allows you to manage audit partners, and provides
                    access to audit documents when needed (e.g., SecureSphere Compliance&quot;).
                  </p>
                }
              />
            </div>
            <Input id="auditFirm" {...form.register('auditFirm')} placeholder="SecureSphere Compliance" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Label htmlFor="auditor">Name</Label>
              <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={<p>Enter the name of your primary contact at the audit firm (e.g. Amy Shields).</p>} />
            </div>
            <Input id="auditor" {...form.register('auditor')} placeholder="Amy Shields" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Label htmlFor="auditorEmail">Email</Label>
              <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={<p>Enter the email address of your primary contact at the audit firm (e.g. amy.shields@securesphere.io).</p>} />
            </div>
            <Input id="auditorEmail" {...form.register('auditorEmail')} placeholder="amy.shields@securesphere.io" />
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <SaveButton onClick={form.handleSubmit(onSubmit)} />
          <CancelButton onClick={() => setOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
