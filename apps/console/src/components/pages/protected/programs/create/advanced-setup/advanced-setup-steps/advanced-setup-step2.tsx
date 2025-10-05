'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
// ako koristiš custom inpute iz @repo/ui ili nešto drugo, možeš prilagoditi
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { CalendarPopover } from '@repo/ui/calendar-popover'

const AdvancedSetupStep2 = () => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext()

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">General Information</h2>
        <p className="text-sm text-muted-foreground">Set the foundation by choosing a framework, naming your program, and defining the timeline. This helps organize everything that follows.</p>
      </div>

      {/* Tips card */}
      <div className="p-4 rounded-md border border-tip-border bg-tip-background">
        <div className="flex gap-2 items-start mb-3">
          <Lightbulb className="text-tip-text" size={18} />
          <span className="text-sm text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">
          A well-structured compliance program has the potential to completely transform your organization, enhancing its operational efficiency and fostering a culture of integrity and
          accountability.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
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

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Start Date</label>
            <CalendarPopover />

            {/* <DatePicker selected={startDate} onSelect={(date) => setValue('startDate', date)} placeholderText="Select start date" /> */}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">End Date</label>
            <CalendarPopover />

            {/* <DatePicker selected={endDate} onSelect={(date) => setValue('endDate', date)} placeholderText="Select end date" /> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep2
