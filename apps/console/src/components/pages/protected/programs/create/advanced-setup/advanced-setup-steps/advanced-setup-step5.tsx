'use client'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Lightbulb } from 'lucide-react'
import MultipleSelector from '@repo/ui/multiple-selector'
import { z } from 'zod'
import { step5Schema } from '../advanced-setup-wizard-config'
import { useRiskSelect } from '@/lib/graphql-hooks/risks'
import { usePolicySelect } from '@/lib/graphql-hooks/policy'
import { useProcedureSelect } from '@/lib/graphql-hooks/procedures'

type FormType = z.infer<typeof step5Schema>

const AdvancedSetupStep5 = () => {
  const { control } = useFormContext<FormType>()
  const { riskOptions } = useRiskSelect()
  const { policyOptions } = usePolicySelect()
  const { procedureOptions } = useProcedureSelect()

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
        <div className="flex gap-2 items-start mb-3">
          <Lightbulb className="text-tip-text" size={18} />
          <span className="text-sm text-tip-text">Tips</span>
        </div>
        <p className="text-sm text-tip-text">Users can import or create new objects later if they don’t have any available today.</p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Associate Existing Risks */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Associate Existing Risks</label>
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

        {/* Associate Existing Policies */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Associate Existing Policies</label>
          <Controller
            control={control}
            name="internalPolicyIDs"
            render={({ field }) => (
              <MultipleSelector
                placeholder="Select policies from the list"
                options={policyOptions}
                value={policyOptions.filter((o) => field.value?.includes(o.value))}
                onChange={(selected) => field.onChange(selected.map((o) => o.value))}
              />
            )}
          />
        </div>

        {/* Associate Existing Procedures */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Associate Existing Procedures</label>
          <Controller
            control={control}
            name="procedureIDs"
            render={({ field }) => (
              <MultipleSelector
                placeholder="Select procedures from the list"
                options={procedureOptions}
                value={procedureOptions.filter((o) => field.value?.includes(o.value))}
                onChange={(selected) => field.onChange(selected.map((o) => o.value))}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default AdvancedSetupStep5
