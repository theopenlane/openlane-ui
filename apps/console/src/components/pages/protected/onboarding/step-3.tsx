'use client'
import React, { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'

export const step3Schema = z.object({
  compliance: z.object({
    existing_policies_procedures: z.boolean().default(false),
    completed_risk_assessment: z.boolean().default(false),
    completed_gap_analysis: z.boolean().default(false),
    existing_controls: z.boolean().default(false),
  }),
})

type Step3Values = zInfer<typeof step3Schema>

export default function Step3() {
  const { setValue, watch } = useFormContext<Step3Values>()

  useEffect(() => {
    setValue('compliance.existing_policies_procedures', watch('compliance.existing_policies_procedures') ?? false)
    setValue('compliance.completed_risk_assessment', watch('compliance.completed_risk_assessment') ?? false)
    setValue('compliance.completed_gap_analysis', watch('compliance.completed_gap_analysis') ?? false)
    setValue('compliance.existing_controls', watch('compliance.existing_controls') ?? false)
  }, [setValue, watch])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Compliance Info</h2>

      {/* Existing Policies & Procedures */}
      <div className="flex items-center justify-between">
        <Label>Existing Policies & Procedures</Label>
        <Switch checked={watch('compliance.existing_policies_procedures') ?? false} onCheckedChange={(value) => setValue('compliance.existing_policies_procedures', value)} />
      </div>

      {/* Completed Risk Assessment */}
      <div className="flex items-center justify-between">
        <Label>Completed Risk Assessment</Label>
        <Switch checked={watch('compliance.completed_risk_assessment') ?? false} onCheckedChange={(value) => setValue('compliance.completed_risk_assessment', value)} />
      </div>

      {/* Completed Gap Analysis */}
      <div className="flex items-center justify-between">
        <Label>Completed Gap Analysis</Label>
        <Switch checked={watch('compliance.completed_gap_analysis') ?? false} onCheckedChange={(value) => setValue('compliance.completed_gap_analysis', value)} />
      </div>

      {/* Existing Controls */}
      <div className="flex items-center justify-between">
        <Label>Existing Controls</Label>
        <Switch checked={watch('compliance.existing_controls') ?? false} onCheckedChange={(value) => setValue('compliance.existing_controls', value)} />
      </div>
    </div>
  )
}
