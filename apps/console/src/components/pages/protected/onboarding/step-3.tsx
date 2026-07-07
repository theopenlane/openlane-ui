'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { COMPLIANCE_FRAMEWORK_OPTIONS, COMPLIANCE_FRAMEWORKS } from '@/components/pages/protected/onboarding/constants'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'

export const step3Schema = z.object({
  compliance: z.object({
    frameworks: z.array(z.string()).optional(),
    existing_controls: z.boolean().optional(),
    existing_policies_procedures: z.boolean().optional(),
  }),
})

type Step3Values = zInfer<typeof step3Schema>

const controlOptions = [
  { value: 'true', label: 'Yes', description: 'We have existing controls we want to import' },
  { value: 'false', label: 'No', description: 'Import templates to help us get started' },
]

const policyOptions = [
  { value: 'true', label: 'Yes', description: "We'd like to import them via upload or integrations" },
  { value: 'false', label: 'No', description: "We'd like policy templates to get us started" },
]

export default function Step3() {
  const {
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<Step3Values>()

  const frameworks = watch('compliance.frameworks') ?? []

  const toggleFramework = (framework: string, checked: boolean) => {
    const nextFrameworks = checked ? [...new Set([...frameworks, framework])] : frameworks.filter((item) => item !== framework)
    setValue('compliance.frameworks', nextFrameworks, { shouldDirty: true, shouldValidate: true })
  }

  const handleControlChange = (value: string) => {
    setValue('compliance.existing_controls', value === 'true', { shouldDirty: true, shouldValidate: true })
  }

  const handlePolicyChange = (value: string) => {
    setValue('compliance.existing_policies_procedures', value === 'true', { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Compliance Setup</h2>
        <p className="text-sm text-text-light">Help us tailor your compliance program and recommend the right starting point.</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>1. What compliance program are you working toward?</Label>
          <p className="text-xs text-text-light">Select all frameworks you are currently pursuing</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {COMPLIANCE_FRAMEWORK_OPTIONS.map((framework) => {
            const id = `framework-${framework.value.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`
            const checked = frameworks.includes(framework.value)

            return (
              <div
                key={framework.value}
                className={`flex items-center gap-3 rounded-md border bg-background p-3 [&_[role=checkbox]]:border-slate-400 [&_[role=checkbox]]:bg-white [&_[role=checkbox]]:shadow-sm dark:[&_[role=checkbox]]:border-border dark:[&_[role=checkbox]]:bg-background [&_[role=checkbox][data-state=checked]]:border-primary [&_[role=checkbox][data-state=checked]]:bg-primary ${
                  checked ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border'
                }`}
              >
                <Checkbox id={id} checked={checked} onCheckedChange={(value) => toggleFramework(framework.value, value === true)} />
                {framework.value !== COMPLIANCE_FRAMEWORKS.other && <StandardsIconMapper shortName={framework.value} height={64} width={64} />}
                <Label htmlFor={id} className="w-full cursor-pointer font-medium">
                  {framework.label}
                </Label>
              </div>
            )
          })}
        </div>
        {errors.compliance?.frameworks && <p className="text-red-500 text-sm">{errors.compliance.frameworks.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>2. Do you already have your own organization controls documented?</Label>
        <RadioGroup
          value={watch('compliance.existing_controls') === undefined ? '' : String(watch('compliance.existing_controls'))}
          onValueChange={handleControlChange}
          className="grid gap-3 sm:grid-cols-2"
        >
          {controlOptions.map((option) => {
            const id = `controls-${option.value}`
            const checked = String(watch('compliance.existing_controls')) === option.value

            return (
              <Label key={option.value} htmlFor={id} variant="card" selected={checked}>
                <RadioGroupItem id={id} value={option.value} className="mt-1 h-5 w-5 shrink-0" />
                <span className="block">
                  <span className="block font-semibold text-sm">{option.label}</span>
                  {option.description && <span className="block text-xs text-text-light">{option.description}</span>}
                </span>
              </Label>
            )
          })}
        </RadioGroup>
        {errors.compliance?.existing_controls && <p className="text-red-500 text-sm">{errors.compliance.existing_controls.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>3. Do you already have policies and procedures?</Label>
        <RadioGroup
          value={watch('compliance.existing_policies_procedures') === undefined ? '' : String(watch('compliance.existing_policies_procedures'))}
          onValueChange={handlePolicyChange}
          className="grid gap-3 sm:grid-cols-2"
        >
          {policyOptions.map((option) => {
            const id = `policies-${option.value}`
            const checked = String(watch('compliance.existing_policies_procedures')) === option.value

            return (
              <Label key={option.value} htmlFor={id} variant="card" selected={checked}>
                <RadioGroupItem id={id} value={option.value} className="mt-1 h-5 w-5 shrink-0" />
                <span className="block">
                  <span className="block font-semibold text-sm">{option.label}</span>
                  {option.description && <span className="block text-xs text-text-light">{option.description}</span>}
                </span>
              </Label>
            )
          })}
        </RadioGroup>
        {errors.compliance?.existing_policies_procedures && <p className="text-red-500 text-sm">{errors.compliance.existing_policies_procedures.message}</p>}
      </div>
    </div>
  )
}
