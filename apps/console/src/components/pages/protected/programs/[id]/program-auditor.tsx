'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import { CircleCheck, CircleX } from 'lucide-react'
import { SetAuditorDialog } from './set-auditor-dialog'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { Input } from '@repo/ui/input'
import SetReadyForAuditorDialog from './set-ready-for-auditor-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useParams } from 'next/navigation'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface ProgramAuditorProps {
  firm?: string | null
  name?: string | null
  email?: string | null
  isReady?: boolean
  programStatus: ProgramProgramStatus
}

const setAuditorSchema = z.object({
  auditorName: z.string().optional().nullable(),
  auditorEmail: z.string().optional().nullable(),
  auditFirm: z.string().optional(),
  auditorReadComments: z.boolean().default(false),
  auditorWriteComments: z.boolean().default(false),
  auditorReady: z.boolean().default(false),
})

type SetAuditorFormValues = z.infer<typeof setAuditorSchema>

const ProgramAuditor = ({ firm, name, email, isReady, programStatus }: ProgramAuditorProps) => {
  const hasAuditor = !!(firm || name || email)
  const { id } = useParams<{ id: string | undefined }>()
  const { data: permission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const isEditAllowed = canEdit(permission?.roles)

  const [isEditing, setIsEditing] = useState(false)
  const [isEligibleForAuditorSet, setIsEligibleForAuditorSet] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const queryClient = useQueryClient()

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  const form = useForm<SetAuditorFormValues>({
    resolver: zodResolver(setAuditorSchema),
    defaultValues: {
      auditorName: name ?? '',
      auditorEmail: email ?? '',
      auditFirm: firm ?? '',
      auditorReadComments: false,
      auditorWriteComments: false,
      auditorReady: false,
    },
  })

  useEffect(() => {
    if (name || email || firm) {
      form.reset({
        auditorName: name ?? '',
        auditorEmail: email ?? '',
        auditFirm: firm ?? '',
        auditorReadComments: false,
        auditorWriteComments: false,
        auditorReady: false,
      })
      setIsEligibleForAuditorSet(true)
    }
    setIsEditing(false)
    return () => {
      setIsEligibleForAuditorSet(false)
    }
  }, [name, email, firm, id, form])

  const { handleSubmit, control } = form

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const onSubmit = async (values: SetAuditorFormValues) => {
    if (values.auditorEmail && values.auditorEmail !== '' && !isValidEmail(values.auditorEmail)) {
      errorNotification({
        title: 'Wrong email format',
      })
      return
    }
    try {
      await updateProgram({
        updateProgramId: id!,
        input: {
          ...(values.auditFirm === '' ? { clearAuditFirm: true } : { auditFirm: values.auditFirm }),
          ...(values.auditorName === '' ? { clearAuditor: true } : { auditor: values.auditorName }),
          ...(values.auditorEmail === '' ? { clearAuditorEmail: true } : { auditorEmail: values.auditorEmail }),
        },
      })
      successNotification({
        title: 'Auditor updated',
        description: 'Auditor saved successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['programs', id] })
      setIsEditing(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Card className="p-8 w-full">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold">Auditor of this program</h2>
            <div className="flex gap-2">
              {!isEditing && isEligibleForAuditorSet && isEditAllowed && <SetReadyForAuditorDialog programStatus={programStatus} />}
              {hasAuditor && !isEditing && isEditAllowed && (
                <Button
                  disabled={programStatus === ProgramProgramStatus.ARCHIVED}
                  className="h-8! p-2!"
                  variant="secondary"
                  type="button"
                  icon={<Pencil />}
                  iconPosition="left"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <SaveButton disabled={isPending} />
                <CancelButton onClick={handleCancel}></CancelButton>
              </div>
            )}
          </div>

          {hasAuditor && !isEditing ? (
            <div className="space-y-3 text-sm">
              <div className="flex border-b pb-2.5">
                <span className="block w-32">Firm:</span> <span>{firm || '—'}</span>
              </div>
              <div className="flex border-b pb-2.5">
                <span className="block w-32">Name:</span> <span>{name || '—'}</span>
              </div>
              <div className="flex border-b pb-2.5">
                <span className="block w-32">Email:</span> <span>{email || '—'}</span>
              </div>
              <div className="flex pb-2.5">
                <span className="block w-32">Auditor Ready:</span>
                <span>
                  {isReady ? (
                    <div className="flex gap-1 items-center text-green-500">
                      <CircleCheck size={16} />
                      <span>Ready</span>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center text-red-500">
                      <CircleX size={16} />
                      <span>Not ready</span>
                    </div>
                  )}
                </span>
              </div>
            </div>
          ) : hasAuditor && isEditing ? (
            <div className="space-y-3 text-sm">
              <div className="flex border-b pb-2.5 gap-2 items-center">
                <span className="w-32 flex shrink-0">Firm:</span>
                <div className="flex flex-col gap-1.5">
                  {isEditing && <Controller control={control} name="auditFirm" render={({ field }) => <Input {...field} className="w-[180px]" placeholder="SecureSphere Compliance" />}></Controller>}
                  {form.formState.errors.auditFirm && <p className="text-red-500 text-sm">{form.formState.errors.auditFirm.message}</p>}
                </div>
              </div>
              <div className="flex border-b pb-2.5 gap-2 items-center">
                <span className="w-32 flex shrink-0">Name:</span>
                <div className="flex flex-col gap-1.5">
                  {isEditing && (
                    <Controller
                      control={control}
                      name="auditorName"
                      render={({ field }) => <Input {...field} value={field.value ?? ''} className="w-[180px]" placeholder="Amy Shields" />}
                    ></Controller>
                  )}
                  {form.formState.errors.auditorName && <p className="text-red-500 text-sm">{form.formState.errors.auditorName.message}</p>}
                </div>
              </div>
              <div className="flex border-b pb-2.5 gap-2 items-center">
                <span className="w-32 flex shrink-0">Email:</span>
                <div className="flex flex-col gap-1.5">
                  {isEditing && (
                    <Controller
                      control={control}
                      name="auditorEmail"
                      render={({ field }) => <Input {...field} value={field.value ?? ''} className="w-[180px]" placeholder="amy.shields@securesphere.io" />}
                    ></Controller>
                  )}
                  {form.formState.errors.auditorEmail && <p className="text-red-500 text-sm">{form.formState.errors.auditorEmail.message}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">No auditor assigned yet.</p>

              {programStatus !== ProgramProgramStatus.ARCHIVED && isEditAllowed && <SetAuditorDialog />}
            </div>
          )}
        </form>
      </FormProvider>
    </Card>
  )
}

export default ProgramAuditor
