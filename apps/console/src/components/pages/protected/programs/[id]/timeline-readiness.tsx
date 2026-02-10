'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { formatDate } from '@/utils/date'
import { differenceInCalendarDays } from 'date-fns'
import { Card } from '@repo/ui/cardpanel'
import { Pencil } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { ProgramStatusLabels, ProgramIconMapper } from '@/components/shared/enum-mapper/program-enum'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { ProgramStatusOptions } from '@/components/shared/enum-mapper/program-enum'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import clsx from 'clsx'
import { Label } from '@repo/ui/label'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const formSchema = z
  .object({
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
    status: z.nativeEnum(ProgramProgramStatus).optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date()

    if (data.endDate && data.endDate < now) {
      ctx.addIssue({
        path: ['endDate'],
        code: z.ZodIssueCode.custom,
        message: 'End date must be in the future',
      })
    }

    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        path: ['endDate'],
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

const TimelineReadiness = () => {
  const { id } = useParams<{ id: string }>()

  const { data: permission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const isEditAllowed = canEdit(permission?.roles)

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const { data } = useGetProgramBasicInfo(id)
  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const program = data?.program

  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: program?.startDate,
      endDate: program?.endDate,
      status: program?.status ?? ProgramProgramStatus.NOT_STARTED,
    },
  })

  const { handleSubmit, control } = form

  const onSubmit = async (values: FormValues) => {
    const clearStartDate = values.startDate ? undefined : true
    const clearEndDate = values.endDate ? undefined : true

    try {
      await updateProgram({
        updateProgramId: id,
        input: {
          ...values,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
          clearStartDate,
          clearEndDate,
        },
      })

      successNotification({
        title: 'Program updated',
        description: 'Timeline and status saved successfully.',
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

  const handleCancel = () => {
    form.reset({
      startDate: program?.startDate ? new Date(program.startDate) : null,
      endDate: program?.endDate ? new Date(program.endDate) : null,
      status: program?.status ?? ProgramProgramStatus.NOT_STARTED,
    })
    setIsEditing(false)
  }

  useEffect(() => {
    if (program) {
      form.reset({
        startDate: program.startDate ? new Date(program.startDate) : null,
        endDate: program.endDate ? new Date(program.endDate) : null,
        status: program.status ?? ProgramProgramStatus.NOT_STARTED,
      })
    }
  }, [program, form])

  const formattedStartDate = program?.startDate ? formatDate(program.startDate) : null
  const formattedEndDate = program?.endDate ? formatDate(program.endDate) : null
  const dayDiff = program?.startDate && program?.endDate ? differenceInCalendarDays(program.endDate, program.startDate) : 0
  const dayOrDays = dayDiff > 1 ? 'days' : 'day'

  const startDate = form.getValues('startDate')
  const endDate = form.getValues('endDate')
  const errors = form.formState.errors

  return (
    <Card className="p-8 w-full">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Timeline & Readiness</h2>
            {!isEditing && isEditAllowed && (
              <Button
                disabled={program?.status === ProgramProgramStatus.ARCHIVED}
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
            {isEditing && (
              <div className="flex gap-2">
                <SaveButton disabled={isPending} />
                <CancelButton onClick={handleCancel}></CancelButton>
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {/* Status */}
            <div className={clsx('flex pb-3 gap-2 items-center', (startDate || endDate || isEditing) && 'border-b')}>
              {isEditing ? (
                <StatusSelect />
              ) : (
                <>
                  <Label className="w-32 flex shrink-0">Status:</Label>
                  {program?.status && ProgramIconMapper[program.status]}
                  <span>{program?.status ? ProgramStatusLabels[program.status] : '-'}</span>
                </>
              )}
            </div>

            {/* Start Date */}
            {(!!startDate || isEditing) && (
              <div className={clsx('flex gap-2 pb-3 items-center', (endDate || isEditing) && 'border-b')}>
                <Label className="w-32 flex shrink-0">Start Date:</Label>
                {isEditing ? <Controller control={control} name="startDate" render={({ field }) => <CalendarPopover field={field} />} /> : <span>{formattedStartDate || '—'}</span>}
              </div>
            )}

            {/* End Date */}
            {(!!endDate || isEditing) && (
              <div>
                <div className="flex pb-3 gap-2 items-center">
                  <Label className="w-32 flex shrink-0">End Date:</Label>
                  {isEditing ? (
                    <Controller control={control} name="endDate" render={({ field }) => <CalendarPopover field={field} />} />
                  ) : (
                    <span>{formattedEndDate ? (dayDiff > 0 ? `${dayDiff} ${dayOrDays} (${formattedEndDate})` : formattedEndDate) : '—'}</span>
                  )}
                </div>
                {errors.endDate && <span className="text-xs text-destructive">{String(errors.endDate.message)}</span>}
              </div>
            )}
          </div>
        </form>
      </FormProvider>
    </Card>
  )
}

export default TimelineReadiness

const StatusSelect = () => {
  const { control } = useFormContext<FormValues>()

  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem className="flex gap-2 items-center w-full">
          <FormLabel className="w-32 shrink-0">Status</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value} defaultValue={ProgramProgramStatus.NOT_STARTED}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ProgramStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  )
}
