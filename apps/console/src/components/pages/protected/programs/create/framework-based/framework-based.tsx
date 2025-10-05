'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import Link from 'next/link'

type FrameworkFormValues = {
  framework: string
}

const FrameworkBased = () => {
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FrameworkFormValues>({
    defaultValues: {
      framework: '',
    },
  })

  const onSubmit = (data: FrameworkFormValues) => {
    console.log('Selected framework:', data)
    // ovdje ide API call ili nastavak wizard koraka
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 m-auto max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Select a Framework</h2>
        <p className="text-sm text-muted-foreground">Choose the compliance framework this program will follow. This determines the controls, policies, and structure inside your program.</p>
      </div>

      {/* Select Framework */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm">Select Framework</label>
        <Select onValueChange={(val) => setValue('framework', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a framework from the list" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SOC2 - 2025">SOC2 - 2025</SelectItem>
            <SelectItem value="ISO 27001 - 2025">ISO 27001 - 2025</SelectItem>
            <SelectItem value="HIPAA">HIPAA</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {errors.framework && <span className="text-xs text-destructive">{String(errors.framework.message)}</span>}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Link href="/programs/create">
          <Button type="button" variant="back">
            Back
          </Button>
        </Link>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}

export default FrameworkBased
