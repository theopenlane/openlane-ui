'use client'
import React, { useContext, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProgramTypeSelect from '../shared/form-fields/program-select'

import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { CreateProgramWithMembersInput, ProgramProgramType } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const today = new Date()
const oneYearFromToday = addYears(today, 1)

type ProgramFormValues = {
  programType: ProgramProgramType
  name: string
  description: string
}

const GenericProgram = () => {
  const methods = useForm<ProgramFormValues>({
    defaultValues: {
      programType: undefined,
      name: '',
      description: '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods

  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createProgram } = useCreateProgramWithMembers()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const onSubmit = async (data: ProgramFormValues) => {
    try {
      const input: CreateProgramWithMembersInput = {
        program: {
          name: data.name,
          description: data.description,
          programType: data.programType,
          startDate: today,
          endDate: oneYearFromToday,
        },
      }

      const resp = await createProgram({ input })

      successNotification({
        title: 'Program Created',
        description: `Your program "${resp?.createProgramWithMembers?.program?.name}" has been successfully created.`,
      })

      router.push(`/programs?id=${resp?.createProgramWithMembers?.program?.id}`)
    } catch (e) {
      const errorMessage = parseErrorMessage(e)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'Generic based', href: '/programs/create/generic-program' },
    ])
  }, [setCrumbs])

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl m-auto">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium">Create a Generic Program</h2>
          <p className="text-sm text-muted-foreground">Start with a blank program you can shape to your needs. Just give it a name and choose a type to get started.</p>
        </div>

        <div className="space-y-1.5">
          {/* Program Type */}
          <div className="flex flex-col">
            <ProgramTypeSelect />
            {errors.programType && <span className="text-xs text-destructive">{errors.programType.message as string}</span>}
          </div>

          {/* Program Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">
              Program Name<span className="text-destructive">*</span>
            </label>
            <Input placeholder="Program Test" {...register('name', { required: 'Program name is required' })} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message as string}</span>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Description</label>
            <Textarea placeholder="Enter a description for this program" {...register('description')} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Link href="/programs/create">
            <Button type="button" variant="back">
              Back
            </Button>
          </Link>
          <Button type="submit">Create Program</Button>
        </div>
      </form>
    </FormProvider>
  )
}

export default GenericProgram
