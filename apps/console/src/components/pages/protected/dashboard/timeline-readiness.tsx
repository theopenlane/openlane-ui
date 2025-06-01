'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetProgramBasicInfo, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { formatDate } from '@/utils/date'
import { differenceInCalendarDays } from 'date-fns'
import { Card } from '@repo/ui/cardpanel'
import { Pencil } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { PROGRAM_STATUS_LABELS, ProgramIconMapper } from '@/components/shared/icon-enum/program-enum'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'

const formSchema = z.object({
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  status: z.nativeEnum(ProgramProgramStatus).optional(),
})

type FormValues = z.infer<typeof formSchema>

const TimelineReadiness = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const { data } = useGetProgramBasicInfo(programId)
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
    try {
      await updateProgram({
        updateProgramId: programId!,
        input: {
          ...values,
          startDate: values.startDate ?? undefined,
          endDate: values.endDate ?? undefined,
        },
      })

      successNotification({
        title: 'Program updated',
        description: 'Timeline and status saved successfully.',
      })

      queryClient.invalidateQueries({ queryKey: ['programs', programId] })

      setIsEditing(false)
    } catch (error) {
      errorNotification({
        title: 'Failed to update program',
        gqlError: error,
      })
    }
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

  return (
    <Card className="p-8 w-full">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold mb-4">Timeline & Readiness</h2>
            {!isEditing && (
              <Button variant="outline" type="button" icon={<Pencil />} iconPosition="left" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            {isEditing && (
              <Button variant="outline" type="submit" icon={<Pencil />} iconPosition="left" disabled={isPending}>
                Save edit
              </Button>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {/* Status */}
            <div className="flex border-b pb-2.5 gap-2 items-center">
              {isEditing ? (
                <StatusSelect />
              ) : (
                <>
                  <span className="block w-32 flex shrink-0">Status:</span>
                  {program?.status && ProgramIconMapper[program.status]}
                  <span>{program?.status ? PROGRAM_STATUS_LABELS[program.status] : '-'}</span>
                </>
              )}
            </div>

            {/* Start Date */}
            <div className="flex border-b pb-2.5 gap-2 items-center">
              <span className="block w-32 flex shrink-0">Start Date:</span>
              {isEditing ? <Controller control={control} name="startDate" render={({ field }) => <CalendarPopover field={field} />} /> : <span>{formattedStartDate || '—'}</span>}
            </div>

            {/* End Date */}
            <div className="flex pb-2.5 gap-2 items-center">
              <span className="block w-32 flex shrink-0">End Date:</span>
              {isEditing ? (
                <Controller control={control} name="endDate" render={({ field }) => <CalendarPopover field={field} />} />
              ) : (
                <span>{formattedEndDate ? (dayDiff > 0 ? `${dayDiff} ${dayOrDays} (${formattedEndDate})` : formattedEndDate) : '—'}</span>
              )}
            </div>
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
        <FormItem className="flex pb-2.5 gap-2 items-center w-full">
          <FormLabel className="w-32 shrink-0">Status</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value} defaultValue={ProgramProgramStatus.NOT_STARTED}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ProgramProgramStatus).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {key[0].toUpperCase() + key.slice(1).replaceAll('_', ' ').toLowerCase()}
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
