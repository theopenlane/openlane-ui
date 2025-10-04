'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
import MultipleSelector from '@repo/ui/multiple-selector'
// Pretpostavka: koristiš iste MultiSelect / Combobox komponente

const AdvancedSetupStep5 = () => {
  const { setValue, watch } = useFormContext()

  const risks = watch('existingRisks') || []
  const policies = watch('existingPolicies') || []
  const procedures = watch('existingProcedures') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Associate Existing Objects</h2>
        <p className="text-sm text-muted-foreground">
          Link any existing risks, policies, controls, or evidence to this program. This saves time by reusing work you’ve already created instead of starting from scratch.
        </p>
      </div>

      {/* Tips card */}
      <div className="p-4 rounded-md border border-tip-border bg-tip-background">
        <div className="flex gap-2 items-start mb-1">
          <Lightbulb className="text-tip-text mt-0.5" size={18} />
          <span className="text-sm font-medium text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">Users can import or create new objects later if they don’t have any available today.</p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Associate Existing Risks */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Associate Existing Risks</label>
          <MultipleSelector placeholder="Select risks from the list" value={risks} onChange={(val) => setValue('existingRisks', val)} />
        </div>

        {/* Associate Existing Policies */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Associate Existing Policies</label>
          <MultipleSelector placeholder="Select policies from the list" value={policies} onChange={(val) => setValue('existingPolicies', val)} />
        </div>

        {/* Associate Existing Procedures */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Associate Existing Procedures</label>
          <MultipleSelector placeholder="Select procedures from the list" value={procedures} onChange={(val) => setValue('existingProcedures', val)} />
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep5
