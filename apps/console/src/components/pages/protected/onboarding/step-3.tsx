'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { COMPLIANCE_FRAMEWORK_OPTIONS } from '@/components/pages/protected/onboarding/constants'

export const step3Schema = z.object({
  compliance: z.object({
    frameworks: z.array(z.string()).min(1, 'Select at least one compliance program'),
    controls_documented: z.boolean({ required_error: 'Select an option' }),
    policies_documented: z.boolean({ required_error: 'Select an option' }),
  }),
})

type Step3Values = zInfer<typeof step3Schema>

const controlOptions = [
  { value: 'true', label: 'Yes, we have existing controls', description: "We'd like to import our current controls." },
  { value: 'false', label: 'No, we need a starting template', description: 'Use recommended controls to get started.' },
]

const policyOptions = [
  { value: 'true', label: 'Yes, we have existing policies', description: "We'd like to import our current policies." },
  { value: 'false', label: 'No, we need policy templates', description: 'Use policy templates to get started.' },
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
    setValue('compliance.controls_documented', value === 'true', { shouldDirty: true, shouldValidate: true })
  }

  const handlePolicyChange = (value: string) => {
    setValue('compliance.policies_documented', value === 'true', { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Compliance Setup</h2>
        <p className="text-sm text-text-light">Help us tailor your compliance program and recommend the right starting point.</p>
      </div>

      <div className="space-y-3">
        <Label>1. What compliance program are you working toward? (Select all that apply)</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {COMPLIANCE_FRAMEWORK_OPTIONS.map((framework) => {
            const id = `framework-${framework.value.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`
            const checked = frameworks.includes(framework.value)
            const Icon = framework.icon

            return (
              <div key={framework.value} className={`flex items-center gap-3 rounded-md border bg-background p-3 ${checked ? 'border-brand bg-brand/5' : ''}`}>
                <Checkbox id={id} checked={checked} onCheckedChange={(value) => toggleFramework(framework.value, value === true)} />
                <Icon size={18} />
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
        <Label>2. Do you already have compliance controls documented?</Label>
        <RadioGroup
          value={watch('compliance.controls_documented') === undefined ? '' : String(watch('compliance.controls_documented'))}
          onValueChange={handleControlChange}
          className="grid gap-3 sm:grid-cols-2"
        >
          {controlOptions.map((option) => {
            const id = `controls-${option.value}`
            const checked = String(watch('compliance.controls_documented')) === option.value

            return (
              <Label
                key={option.value}
                htmlFor={id}
                className={`flex min-h-[96px] w-full cursor-pointer items-start gap-3 rounded-md border p-4 font-normal leading-5 transition-colors ${
                  checked ? 'border-brand bg-secondary ring-1 ring-brand' : 'bg-transparent hover:bg-muted/20'
                }`}
              >
                <RadioGroupItem id={id} value={option.value} className="mt-1 data-[state=checked]:bg-brand data-[state=checked]:text-white" />
                <span className="block">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-xs text-text-light">{option.description}</span>
                </span>
              </Label>
            )
          })}
        </RadioGroup>
        {errors.compliance?.controls_documented && <p className="text-red-500 text-sm">{errors.compliance.controls_documented.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>3. Do you already have policies and procedures?</Label>
        <RadioGroup
          value={watch('compliance.policies_documented') === undefined ? '' : String(watch('compliance.policies_documented'))}
          onValueChange={handlePolicyChange}
          className="grid gap-3 sm:grid-cols-2"
        >
          {policyOptions.map((option) => {
            const id = `policies-${option.value}`
            const checked = String(watch('compliance.policies_documented')) === option.value

            return (
              <Label
                key={option.value}
                htmlFor={id}
                className={`flex min-h-[96px] w-full cursor-pointer items-start gap-3 rounded-md border p-4 font-normal leading-5 transition-colors ${
                  checked ? 'border-brand bg-secondary ring-1 ring-brand' : 'bg-transparent hover:bg-muted/20'
                }`}
              >
                <RadioGroupItem id={id} value={option.value} className="mt-1 data-[state=checked]:bg-brand data-[state=checked]:text-white" />
                <span className="block">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-xs text-text-light">{option.description}</span>
                </span>
              </Label>
            )
          })}
        </RadioGroup>
        {errors.compliance?.policies_documented && <p className="text-red-500 text-sm">{errors.compliance.policies_documented.message}</p>}
      </div>
    </div>
  )
}
