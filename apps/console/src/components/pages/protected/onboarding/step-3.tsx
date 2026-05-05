'use client'
import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'

export const step3Schema = z.object({
  compliance: z.object({
    existing_policies_procedures: z.boolean().default(false),
    completed_risk_assessment: z.boolean().default(false),
    completed_gap_analysis: z.boolean().default(false),
    existing_controls: z.boolean().default(false),
  }),
  demo_requested: z.boolean().default(false),
})

type Step3Values = zInfer<typeof step3Schema>

export default function Step3() {
  const { setValue, control } = useFormContext<Step3Values>()
  const completedRiskAssessment = useWatch({ control, name: 'compliance.completed_risk_assessment' }) ?? false
  const completedGapAnalysis = useWatch({ control, name: 'compliance.completed_gap_analysis' }) ?? false
  const existingControls = useWatch({ control, name: 'compliance.existing_controls' }) ?? false
  const existingPoliciesProcedures = useWatch({ control, name: 'compliance.existing_policies_procedures' }) ?? false
  const demoRequested = useWatch({ control, name: 'demo_requested' }) ?? false

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Compliance Info</h2>
      <p className="text-sm text-text-light">Help us tailor your experience by sharing where you are in your compliance journey. Just a few quick questions to get started!</p>
      <div className="flex items-center justify-between">
        <Label>Have you previously completed a risk assessment?</Label>
        <Switch checked={completedRiskAssessment} onCheckedChange={(value) => setValue('compliance.completed_risk_assessment', value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Have you gone through a gap analysis?</Label>
        <Switch checked={completedGapAnalysis} onCheckedChange={(value) => setValue('compliance.completed_gap_analysis', value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Do you have existing controls you&apos;d like to import?</Label>
        <Switch checked={existingControls} onCheckedChange={(value) => setValue('compliance.existing_controls', value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Do you have existing policies and procedures you would like to import?</Label>
        <Switch checked={existingPoliciesProcedures} onCheckedChange={(value) => setValue('compliance.existing_policies_procedures', value)} />
      </div>
      <hr className="border-border" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Want help getting started?</h3>
        <p className="text-sm text-text-light">Our team can walk you through your workspace and help structure your program based on your frameworks and goals.</p>
        <div className="flex items-center justify-between">
          <Label>Schedule a personalized walkthrough</Label>
          <Switch checked={demoRequested} onCheckedChange={(value) => setValue('demo_requested', value)} />
        </div>
      </div>
    </div>
  )
}
