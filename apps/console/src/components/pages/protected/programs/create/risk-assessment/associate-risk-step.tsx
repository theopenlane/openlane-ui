'use client'

import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
import { useRiskSelect } from '@/lib/graphql-hooks/risk'
import MultipleSelector from '@repo/ui/multiple-selector'

const AssociateRisksStep = () => {
  const { control } = useFormContext()
  const { riskOptions } = useRiskSelect()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Associate Existing Risks</h2>
        <p className="text-sm text-muted-foreground">Pull in risks your organization has already logged to kickstart this assessment. You can always add more later.</p>
      </div>

      {/* Tips card */}
      <div className="p-4 rounded-md border border-tip-border bg-tip-background">
        <div className="flex gap-2 items-start mb-3">
          <Lightbulb className="text-tip-text" size={18} />
          <span className="text-sm text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">Don&apos;t have risks yet? No problem — you can create new ones during or after this setup.</p>
      </div>

      {/* Risks selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm">Select Existing Risks</label>
        <Controller
          control={control}
          name="riskIDs"
          render={({ field }) => (
            <MultipleSelector
              placeholder="Select risks from the list"
              options={riskOptions}
              value={riskOptions.filter((o) => field.value?.includes(o.value))}
              onChange={(selected) => field.onChange(selected.map((o) => o.value))}
            />
          )}
        />
      </div>
    </div>
  )
}

export default AssociateRisksStep
