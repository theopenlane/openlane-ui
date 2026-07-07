'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'

export const step4Schema = z.object({
  compliance: z.object({
    has_auditor: z.boolean().optional(),
    recommend_auditors: z.boolean().optional(),
    auditor_name: z.string().optional(),
    auditor_email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
    has_vciso_partner: z.boolean().optional(),
    // has_vciso_partner is just a boolean but in reality false could either be "i will do this later" or "no, we want recommendations"
    // which is why recommend_vciso_partner exists.
    // The above can be a string but then we will need to start hardcoding strings across frontend and backend
    // this makes it easier to be able to pull from db (if needed ) orgs that asked for a recommendation
    recommend_vciso_partner: z.boolean().optional(),
  }),
  demo_requested: z.boolean().optional(),
})

type Step4Values = zInfer<typeof step4Schema>

type RadioOption = {
  value: string
  label: string
}

type RadioQuestionProps = {
  name: 'has_auditor' | 'has_vciso_partner' | 'demo_requested'
  title: string
  helper: string
  options: RadioOption[]
}

const gridColsClass: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

const questions: RadioQuestionProps[] = [
  {
    name: 'has_auditor',
    title: 'Are you currently working with an auditor?',
    helper: 'This helps us tailor your setup and, if needed, recommend an auditor experienced with your compliance framework',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'recommendations', label: "No, we'd like recommendations" },
      { value: 'not_yet', label: 'Not yet' },
    ],
  },
  {
    name: 'has_vciso_partner',
    title: 'Looking for a Hands-On Compliance Team?',
    helper: 'Need extra support? We can introduce you to trusted partners who can help build and manage your compliance program',
    options: [
      { value: 'no', label: 'No' },
      {
        value: 'connect_vciso_partner',
        label: "Yes, I'd like to connect with a vCISO",
      },
      { value: 'existing_partner', label: 'Yes, I already have a partner' },
    ],
  },
  {
    name: 'demo_requested',
    title: 'Want help getting started?',
    helper: 'Schedule time with our team for onboarding guidance, product questions, and best practices',
    options: [
      { value: 'true', label: 'Yes, please reach out' },
      { value: 'false', label: "No, I'm good for now" },
    ],
  },
]

export default function Step4() {
  const {
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<Step4Values>()

  const handleValueChange = (name: RadioQuestionProps['name'], value: string) => {
    if (name === 'demo_requested') {
      setValue('demo_requested', value === 'true', { shouldDirty: true, shouldValidate: true })
      return
    }

    if (name === 'has_auditor') {
      setValue('compliance.has_auditor', value === 'yes', { shouldDirty: true, shouldValidate: true })
      setValue('compliance.recommend_auditors', value === 'recommendations', { shouldDirty: true, shouldValidate: true })
      if (value !== 'yes') {
        setValue('compliance.auditor_name', '', { shouldDirty: true, shouldValidate: true })
        setValue('compliance.auditor_email', '', { shouldDirty: true, shouldValidate: true })
      }
      return
    }

    if (name === 'has_vciso_partner') {
      setValue('compliance.has_vciso_partner', value === 'existing_partner', { shouldDirty: true, shouldValidate: true })
      setValue('compliance.recommend_vciso_partner', value === 'connect_vciso_partner', { shouldDirty: true, shouldValidate: true })
    }
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

  const vcisoPartnerValue = () => {
    if (watch('compliance.has_vciso_partner') === undefined || watch('compliance.recommend_vciso_partner') === undefined) {
      return ''
    }

    if (watch('compliance.has_vciso_partner')) {
      return 'existing_partner'
    }

    if (watch('compliance.recommend_vciso_partner')) {
      return 'connect_vciso_partner'
    }

    return 'no'
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Auditor Info</h2>
        <p className="text-sm text-text-light">This helps us guide you with the right audit resources.</p>
      </div>

      {questions.map((question) => {
        const value =
          question.name === 'demo_requested'
            ? watch('demo_requested') === undefined
              ? ''
              : String(watch('demo_requested'))
            : question.name === 'has_auditor'
              ? auditorStatusValue()
              : vcisoPartnerValue()
        const error = question.name === 'demo_requested' ? errors.demo_requested : errors.compliance?.[question.name]

        return (
          <div key={question.name} className="space-y-3">
            <div className="space-y-1">
              <Label>{question.title}</Label>
              {question.helper && <p className="text-xs text-text-light">{question.helper}</p>}
            </div>
            <RadioGroup value={value} onValueChange={(value) => handleValueChange(question.name, value)} className={`grid gap-3 ${gridColsClass[question.options.length] ?? ''}`}>
              {question.options.map((option) => {
                const id = `${question.name}-${option.value}`
                const [label, description] = option.label.split('\n')
                const checked = value === option.value

                return (
                  <Label key={option.value} htmlFor={id} variant="card" selected={checked} className="min-h-[72px]">
                    <RadioGroupItem id={id} value={option.value} className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="block text-sm">{label}</span>
                    {description && <span className="block text-xs text-text-light">{description}</span>}
                  </Label>
                )
              })}
            </RadioGroup>
            {error && <p className="text-red-500 text-sm">{error.message}</p>}
            {question.name === 'has_auditor' && value === 'yes' && (
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
        )
      })}
    </div>
  )
}
