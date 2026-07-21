'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Separator } from '@repo/ui/separator'

export const step4Schema = z.object({
  compliance: z.object({
    existing_controls: z.boolean().optional(),
    existing_policies_procedures: z.boolean().optional(),
  }),
})

type Step4Values = zInfer<typeof step4Schema>

type StartingPointOption = {
  value: 'true' | 'false'
  label: string
  description: string
}

const controlOptions: StartingPointOption[] = [
  {
    value: 'true',
    label: 'Yes, import existing controls',
    description: "We'll help you bring them into Openlane after onboarding",
  },
  {
    value: 'false',
    label: 'No, start with Openlane templates',
    description: "We'll create a recommended set of controls to help you get started",
  },
]

const policyOptions: StartingPointOption[] = [
  {
    value: 'true',
    label: 'Yes, import existing policies',
    description: "We'll help you upload them or connect them through an integration",
  },
  {
    value: 'false',
    label: 'No, start with policy templates',
    description: "We'll provide starter policies and procedures you can customize",
  },
]

const sections: OptionListProps[] = [
  {
    name: 'existing_controls',
    title: 'Controls',
    question: 'Controls are the security and operational practices your organization follows, like requiring MFA, reviewing access, or backing up data. Do you already have controls documented?',
    options: controlOptions,
  },
  {
    name: 'existing_policies_procedures',
    title: 'Policies and procedures',
    question: 'Policies and procedures explain how your organization works, like how employees handle data, respond to incidents, or request access. Do you already have these documented?',
    options: policyOptions,
  },
]

type OptionListProps = {
  name: 'existing_controls' | 'existing_policies_procedures'
  title: string
  question: string
  options: StartingPointOption[]
}

export default function Step4() {
  const {
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<Step4Values>()

  const handleChange = (name: OptionListProps['name'], value: string) => {
    setValue(`compliance.${name}`, value === 'true', { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Starting Point</h2>
        <p className="text-sm text-text-light">Help us understand what you are today so we can customize your onboarding to get you going</p>
      </div>

      {sections.map((section, index) => {
        const value = watch(`compliance.${section.name}`) === undefined ? '' : String(watch(`compliance.${section.name}`))
        const error = errors.compliance?.[section.name]

        return (
          <React.Fragment key={section.name}>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="font-semibold">{section.title}</Label>
                <p className="text-sm text-text-light">{section.question}</p>
              </div>
              <RadioGroup value={value} onValueChange={(next) => handleChange(section.name, next)} className="space-y-3">
                {section.options.map((option) => {
                  const id = `${section.name}-${option.value}`

                  return (
                    <Label key={option.value} htmlFor={id} className="flex cursor-pointer items-start gap-3 font-normal">
                      <RadioGroupItem id={id} value={option.value} className="mt-1 h-5 w-5 shrink-0" />
                      <span className="block">
                        <span className="block font-semibold text-sm">{option.label}</span>
                        <span className="block text-sm text-text-light">{option.description}</span>
                      </span>
                    </Label>
                  )
                })}
              </RadioGroup>
              {error && <p className="text-red-500 text-sm">{error.message}</p>}
            </div>
            {index < sections.length - 1 && <Separator />}
          </React.Fragment>
        )
      })}
    </div>
  )
}
