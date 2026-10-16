'use client'

import React, { useId } from 'react'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { cn } from '@repo/ui/lib/utils'
import { TrustServicesCategoryOption } from '@/components/shared/trust-services-categories/trust-services-category-option'
import { SOC_2_FRAMEWORK_NAME, SOC_2_REQUIRED_CATEGORY, TRUST_SERVICES_CATEGORIES } from '@/constants/trust-services-categories'
import type { ReportProgramChoice } from '../types'

type ProgramStepProps = {
  program: ReportProgramChoice
  setProgram: React.Dispatch<React.SetStateAction<ReportProgramChoice>>
  reportedCategories: string[]
}

const CREATE_OPTIONS = [
  { value: 'yes', label: `Yes, create a ${SOC_2_FRAMEWORK_NAME} program`, description: 'Your imported controls, reviews and findings are linked to it' },
  { value: 'no', label: 'Not now', description: 'Everything still imports, it just will not be grouped into a program' },
] as const

const CreateOption = ({ option, checked }: { option: (typeof CREATE_OPTIONS)[number]; checked: boolean }) => {
  const id = useId()

  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors', checked ? 'border-primary bg-primary/10' : 'border-border')}>
      <RadioGroupItem id={id} value={option.value} className="mt-0.5" />
      <span className="flex flex-col gap-1">
        <span className="font-semibold">{option.label}</span>
        <span className="text-sm text-muted-foreground">{option.description}</span>
      </span>
    </label>
  )
}

export const ProgramStep = ({ program, setProgram, reportedCategories }: ProgramStepProps) => {
  const createTitleId = useId()
  const toggleCategory = (name: string) =>
    setProgram((prev) => {
      const categories = new Set(prev.categories)
      if (categories.has(name)) {
        categories.delete(name)
      } else {
        categories.add(name)
      }
      return { ...prev, categories }
    })

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle id={createTitleId} className="py-3 text-xl">
          Create a program from this import?
        </CardTitle>
        <CardDescription className="pb-4">
          A program groups your controls against a framework so you can track readiness and hand it to an auditor next cycle. You can always create one later.
        </CardDescription>
        <RadioGroup
          aria-labelledby={createTitleId}
          value={program.create ? 'yes' : 'no'}
          onValueChange={(value) => setProgram((prev) => ({ ...prev, create: value === 'yes' }))}
          className="grid-cols-1 px-6 pb-6 md:grid-cols-2"
        >
          {CREATE_OPTIONS.map((option) => (
            <CreateOption key={option.value} option={option} checked={(option.value === 'yes') === program.create} />
          ))}
        </RadioGroup>
      </Card>

      {program.create ? (
        <Card>
          <CardTitle className="py-3 text-xl">Which {SOC_2_FRAMEWORK_NAME} categories?</CardTitle>
          <CardDescription className="pb-4">
            Security is the common criteria and applies to every {SOC_2_FRAMEWORK_NAME}. We checked the categories your report already covers, uncheck any you do not want in the program.
          </CardDescription>
          <div className="flex flex-col gap-3 px-6 pb-6">
            {TRUST_SERVICES_CATEGORIES.map((category) => {
              const isRequired = category.name === SOC_2_REQUIRED_CATEGORY

              return (
                <TrustServicesCategoryOption
                  key={category.name}
                  category={category}
                  checked={program.categories.has(category.name)}
                  onCheckedChange={() => toggleCategory(category.name)}
                  locked={isRequired}
                  requiredLabel={isRequired ? 'Required' : reportedCategories.includes(category.name) ? 'In your report' : undefined}
                />
              )
            })}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
