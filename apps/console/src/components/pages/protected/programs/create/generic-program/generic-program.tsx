'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import Link from 'next/link'

type ProgramFormValues = {
  programType: string
  programName: string
  description: string
}

const GenericProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    defaultValues: {
      programType: '',
      programName: '',
      description: '',
    },
  })

  const onSubmit = (data: ProgramFormValues) => {
    console.log('Form submitted:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl m-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Create a Generic Program</h2>
        <p className="text-sm text-muted-foreground">Start with a blank program you can shape to your needs. Just give it a name and choose a type to get started.</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Program Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">
            Program Type<span className="text-destructive">*</span>
          </label>
          <Select onValueChange={(val) => setValue('programType', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select program type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOC2 - 2025">SOC2 - 2025</SelectItem>
              <SelectItem value="ISO 27001 - 2025">ISO 27001 - 2025</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {errors.programType && <span className="text-xs text-destructive">{String(errors.programType.message)}</span>}
        </div>

        {/* Program Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">
            Program Name<span className="text-destructive">*</span>
          </label>
          <Input placeholder="Program Test" {...register('programName', { required: 'Program name is required' })} />
          {errors.programName && <span className="text-xs text-destructive">{String(errors.programName.message)}</span>}
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
  )
}

export default GenericProgram
