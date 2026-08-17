'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/program'
import { formatDate } from '@/utils/date'
import { differenceInCalendarDays } from 'date-fns'
import { Card } from '@repo/ui/cardpanel'
import { Pencil } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'
import { Controller, useFormContext, FormProvider } from 'react-hook-form'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { ProgramProgramStatus, type UpdateProgramInput } from '@repo/codegen/src/schema'
import { ProgramIconMapper, ProgramStatusOptions } from '@/components/shared/enum-mapper/program-enum'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import clsx from 'clsx'
import { Label } from '@repo/ui/label'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useSession } from 'next-auth/react'
import useTimelineReadinessFormSchema, { changedTimelineFields, type TimelineReadinessFormValues } from './hooks/use-timeline-readiness-form-schema'

const TimelineReadiness = () => {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()

  const { data: permission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const isEditAllowed = canEdit(permission?.roles, session)

  const { successNotification, errorNotification } = useNotification()

  const { data } = useGetProgramBasicInfo(id)
  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const program = data?.program

  const [isEditing, setIsEditing] = useState(false)

  const { form, initialValues } = useTimelineReadinessFormSchema(program)

  const { handleSubmit, control } = form

  const onSubmit = async (values: TimelineReadinessFormValues) => {
    const changed = changedTimelineFields(values, initialValues)

    if (!Object.values(changed).some(Boolean)) {
      setIsEditing(false)
      return
    }

    const input: UpdateProgramInput = {}

    if (changed.status) {
      input.status = values.status
    }

    if (changed.startDate) {
      if (values.startDate) {
        input.startDate = values.startDate
      } else {
        input.clearStartDate = true
      }
    }

    if (changed.endDate) {
      if (values.endDate) {
        input.endDate = values.endDate
      } else {
        input.clearEndDate = true
      }
    }

    try {
      await updateProgram({ updateProgramId: id, input })

      successNotification({
        title: 'Program updated',
        description: 'Timeline and status saved successfully.',
      })

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
    form.reset(initialValues)
    setIsEditing(false)
  }

  useEffect(() => {
    if (program) {
      form.reset(initialValues)
    }
  }, [program, initialValues, form])

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
            <div className={clsx('flex pb-3 gap-2 items-center', (startDate || endDate || isEditing) && 'border-b')}>
              {isEditing ? (
                <StatusSelect />
              ) : (
                <>
                  <Label className="w-32 flex shrink-0">Status:</Label>
                  {program?.status && ProgramIconMapper[program.status]}
                  <span>{program?.status ? getEnumLabel(program.status) : '-'}</span>
                </>
              )}
            </div>

            {(!!startDate || isEditing) && (
              <div className={clsx('flex gap-2 pb-3 items-center', (endDate || isEditing) && 'border-b')}>
                <Label className="w-32 flex shrink-0">Start Date:</Label>
                {isEditing ? <Controller control={control} name="startDate" render={({ field }) => <CalendarPopover field={field} />} /> : <span>{formattedStartDate || '—'}</span>}
              </div>
            )}

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
  const { control } = useFormContext<TimelineReadinessFormValues>()

  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem className="flex gap-2 items-center w-full">
          <FormLabel className="w-32 shrink-0">Status</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value}>
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
