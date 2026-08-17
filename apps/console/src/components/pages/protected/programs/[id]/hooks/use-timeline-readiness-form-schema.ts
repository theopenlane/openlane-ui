'use client'
import { useMemo } from 'react'
import { startOfDay } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProgramProgramStatus, type GetProgramBasicInfoQuery } from '@repo/codegen/src/schema'

const formFields = z.object({
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  status: z.enum(ProgramProgramStatus),
})

export type TimelineReadinessFormValues = z.infer<typeof formFields>

type ProgramTimeline = GetProgramBasicInfoQuery['program']

const dayOf = (date?: Date | null): number | null => (date ? startOfDay(date).getTime() : null)

const toTimelineReadinessValues = (program?: ProgramTimeline): TimelineReadinessFormValues => ({
  startDate: program?.startDate ? new Date(program.startDate) : null,
  endDate: program?.endDate ? new Date(program.endDate) : null,
  status: program?.status ?? ProgramProgramStatus.NOT_STARTED,
})

export const changedTimelineFields = (values: TimelineReadinessFormValues, initialValues: TimelineReadinessFormValues) => ({
  startDate: dayOf(values.startDate) !== dayOf(initialValues.startDate),
  endDate: dayOf(values.endDate) !== dayOf(initialValues.endDate),
  status: values.status !== initialValues.status,
})

const buildFormSchema = (initialValues: TimelineReadinessFormValues) =>
  formFields.superRefine((data, ctx) => {
    const changed = changedTimelineFields(data, initialValues)
    const now = new Date()

    if (changed.endDate && data.endDate && data.endDate < now) {
      ctx.addIssue({
        path: ['endDate'],
        code: 'custom',
        message: 'End date must be in the future',
      })
    }

    if ((changed.startDate || changed.endDate) && data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        path: ['endDate'],
        code: 'custom',
        message: 'End date must be after start date',
      })
    }
  })

const useTimelineReadinessFormSchema = (program?: ProgramTimeline) => {
  const initialValues = useMemo(() => toTimelineReadinessValues(program), [program])
  const formSchema = useMemo(() => buildFormSchema(initialValues), [initialValues])

  const form = useForm<TimelineReadinessFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  return { form, initialValues }
}

export default useTimelineReadinessFormSchema
