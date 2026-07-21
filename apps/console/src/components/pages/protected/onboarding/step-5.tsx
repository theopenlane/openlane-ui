'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Separator } from '@repo/ui/separator'

export const step5Schema = z.object({
  compliance: z.object({
    has_auditor: z.boolean().optional(),
    recommend_auditors: z.boolean().optional(),
    auditor_name: z.string().optional(),
    auditor_email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
    recommend_vciso_partner: z.boolean().optional(),
  }),
  demo_requested: z.boolean().optional(),
})

type Step5Values = zInfer<typeof step5Schema>

export default function Step5() {
  const {
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<Step5Values>()

  const handleAuditorChange = (value: string) => {
    setValue('compliance.has_auditor', value === 'yes', { shouldDirty: true, shouldValidate: true })
    setValue('compliance.recommend_auditors', value === 'recommendations', { shouldDirty: true, shouldValidate: true })
    if (value !== 'yes') {
      setValue('compliance.auditor_name', '', { shouldDirty: true, shouldValidate: true })
      setValue('compliance.auditor_email', '', { shouldDirty: true, shouldValidate: true })
    }
  }

  const [vcisoSelection, setVcisoSelection] = useState(() => (watch('compliance.recommend_vciso_partner') ? 'connect_vciso_partner' : ''))

  const handleVcisoChange = (value: string) => {
    setVcisoSelection(value)
    setValue('compliance.recommend_vciso_partner', value === 'connect_vciso_partner', { shouldDirty: true, shouldValidate: true })
  }

  const auditorStatusValue = () => {
    if (watch('compliance.has_auditor') === undefined || watch('compliance.recommend_auditors') === undefined) {
      return ''
    }

    if (watch('compliance.has_auditor')) {
      return 'yes'
    }

    if (watch('compliance.recommend_auditors')) {
      return 'recommendations'
    }

    return 'not_yet'
  }

  const auditorValue = auditorStatusValue()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Support Preferences</h2>
        <p className="text-sm text-text-light">Let us know how we can support you on your compliance journey.</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="font-semibold text-sm">Are you currently working with an auditor?</Label>
          <p className="text-sm text-text-light">We can suggest audit partners and next steps when you&apos;re ready</p>
        </div>
        <RadioGroup value={auditorValue} onValueChange={handleAuditorChange} className="flex flex-wrap gap-6">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'recommendations', label: 'Need recommendations' },
            { value: 'not_yet', label: 'Not yet' },
          ].map((option) => (
            <Label key={option.value} htmlFor={`has_auditor-${option.value}`} className="flex cursor-pointer items-center gap-2 font-normal text-sm">
              <RadioGroupItem id={`has_auditor-${option.value}`} value={option.value} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
        {errors.compliance?.has_auditor && <p className="text-red-500 text-sm">{errors.compliance.has_auditor.message}</p>}
        {auditorValue === 'yes' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="auditor_name">Auditor name</Label>
              <Input id="auditor_name" placeholder="Amy Shields" {...register('compliance.auditor_name')} />
              {errors.compliance?.auditor_name && <p className="text-red-500 text-sm">{errors.compliance.auditor_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="auditor_email">Auditor email</Label>
              <Input id="auditor_email" type="email" placeholder="amy.shields@securesphere.io" {...register('compliance.auditor_email')} />
              {errors.compliance?.auditor_email && <p className="text-red-500 text-sm">{errors.compliance.auditor_email.message}</p>}
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="font-semibold">Do you want help from a hands-on compliance partner?</Label>
          <p className="text-sm text-text-light">We can suggest partners and next steps when you&apos;re ready</p>
        </div>
        <RadioGroup value={vcisoSelection} onValueChange={handleVcisoChange} className="flex flex-wrap gap-6">
          {[
            { value: 'no', label: 'No' },
            { value: 'connect_vciso_partner', label: 'Connect me with a vCISO' },
            { value: 'existing_partner', label: 'I have a partner' },
          ].map((option) => (
            <Label key={option.value} htmlFor={`vciso_partner-${option.value}`} className="flex cursor-pointer items-center gap-2 font-normal text-sm">
              <RadioGroupItem id={`vciso_partner-${option.value}`} value={option.value} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
        {errors.compliance?.recommend_vciso_partner && <p className="text-red-500 text-sm">{errors.compliance.recommend_vciso_partner.message}</p>}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="font-semibold">Would you like help getting started?</Label>
          <p className="text-sm text-text-light">Our team can help with onboarding, product questions, and best practices.</p>
        </div>
        <Label htmlFor="demo_requested" className="flex cursor-pointer items-center gap-2 font-normal text-sm">
          <Checkbox
            id="demo_requested"
            checked={watch('demo_requested') ?? false}
            onCheckedChange={(value) => setValue('demo_requested', value === true, { shouldDirty: true, shouldValidate: true })}
          />
          Yes, have someone reach out to me
        </Label>
        {errors.demo_requested && <p className="text-red-500 text-sm">{errors.demo_requested.message}</p>}
      </div>
    </div>
  )
}
