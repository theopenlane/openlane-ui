'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'

export const step4Schema = z.object({
  compliance: z.object({
    auditor_status: z.boolean({ required_error: 'Select an option' }),
    auditor_recommendations: z.boolean({ required_error: 'Select an option' }),
    vciso_partner: z.boolean({ required_error: 'Select an option' }),
    // vciso_partner is just a boolean but in reality false could either be "i will do this later" or "no, we want recommendations"
    // which is this vciso_partner_recommendations exists.
    // The above can be a string but then we will need to start hardcoding strings across frontend and backend
    // this makes it easier to be able to pull from db (if needed ) orgs that asked for a recommendation
    vciso_partner_recommendations: z.boolean({ required_error: 'Select an option' }),
  }),
  demo_requested: z.boolean({ required_error: 'Select an option' }),
})

type Step4Values = zInfer<typeof step4Schema>

type RadioOption = {
  value: string
  label: string
}

type RadioQuestionProps = {
  name: 'auditor_status' | 'vciso_partner' | 'demo_requested'
  title: string
  helper: string
  options: RadioOption[]
}

const questions: RadioQuestionProps[] = [
  {
    name: 'auditor_status',
    title: 'Are you currently working with an auditor?',
    helper: '',
    options: [
      { value: 'yes', label: "Yes, we have an auditor\nI'll add their details after setup." },
      { value: 'recommendations', label: 'No, we need recommendations\nShow me recommended audit partners.' },
      { value: 'not_yet', label: "Not yet\nI'll decide later." },
    ],
  },
  {
    name: 'vciso_partner',
    title: 'Looking for a Hands-On Compliance Team?',
    helper: "We can suggest audit partners and next steps when you're ready.",
    options: [
      { value: 'no', label: 'No' },
      {
        value: 'connect_vciso_partner',
        label: "Yes, I'd like to connect with a vCISO partner for ongoing program management, audit readiness, control ownership, and compliance leadership",
      },
      { value: 'existing_partner', label: 'Yes, I already have a partner' },
    ],
  },
  {
    name: 'demo_requested',
    title: 'Want help getting started?',
    helper: 'Our team can reach out to help you get set up and on the right track.',
    options: [
      { value: 'true', label: 'Yes, please reach out' },
      { value: 'false', label: "No, I'm good for now" },
    ],
  },
]

export default function Step4() {
  const {
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<Step4Values>()

  const handleValueChange = (name: RadioQuestionProps['name'], value: string) => {
    if (name === 'demo_requested') {
      setValue('demo_requested', value === 'true', { shouldDirty: true, shouldValidate: true })
      return
    }

    if (name === 'auditor_status') {
      setValue('compliance.auditor_status', value === 'yes', { shouldDirty: true, shouldValidate: true })
      setValue('compliance.auditor_recommendations', value === 'recommendations', { shouldDirty: true, shouldValidate: true })
      return
    }

    if (name === 'vciso_partner') {
      setValue('compliance.vciso_partner', value === 'existing_partner', { shouldDirty: true, shouldValidate: true })
      setValue('compliance.vciso_partner_recommendations', value === 'connect_vciso_partner', { shouldDirty: true, shouldValidate: true })
    }
  }

  const auditorStatusValue = () => {
    if (watch('compliance.auditor_status') === undefined || watch('compliance.auditor_recommendations') === undefined) {
      return ''
    }

    if (watch('compliance.auditor_status')) {
      return 'yes'
    }

    if (watch('compliance.auditor_recommendations')) {
      return 'recommendations'
    }

    return 'not_yet'
  }

  const vcisoPartnerValue = () => {
    if (watch('compliance.vciso_partner') === undefined || watch('compliance.vciso_partner_recommendations') === undefined) {
      return ''
    }

    if (watch('compliance.vciso_partner')) {
      return 'existing_partner'
    }

    if (watch('compliance.vciso_partner_recommendations')) {
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
            : question.name === 'auditor_status'
              ? auditorStatusValue()
              : question.name === 'vciso_partner'
                ? vcisoPartnerValue()
                : ''
        const error = question.name === 'demo_requested' ? errors.demo_requested : errors.compliance?.[question.name]

        return (
          <div key={question.name} className="space-y-3">
            <div className="space-y-1">
              <Label>{question.title}</Label>
              {question.helper && <p className="text-xs text-text-light">{question.helper}</p>}
            </div>
            <RadioGroup value={value} onValueChange={(value) => handleValueChange(question.name, value)}>
              {question.options.map((option) => {
                const id = `${question.name}-${option.value}`
                const [label, description] = option.label.split('\n')
                const checked = value === option.value

                return (
                  <Label
                    key={option.value}
                    htmlFor={id}
                    className={`flex min-h-[72px] w-full cursor-pointer items-start gap-3 rounded-md border p-4 font-normal leading-5 transition-colors ${
                      checked ? 'border-brand bg-secondary ring-1 ring-brand' : 'bg-transparent hover:bg-muted/20'
                    }`}
                  >
                    <RadioGroupItem id={id} value={option.value} className="mt-0.5 data-[state=checked]:bg-brand data-[state=checked]:text-white" />
                    <span className="block">
                      <span className="block font-semibold">{label}</span>
                      {description && <span className="block text-xs text-text-light">{description}</span>}
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
            {error && <p className="text-red-500 text-sm">{error.message}</p>}
          </div>
        )
      })}
    </div>
  )
}
