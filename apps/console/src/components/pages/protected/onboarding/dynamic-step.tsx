'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { DynamicQuestionField, HelpTooltip } from '@/components/pages/protected/onboarding/dynamic-field'
import { isQuestionVisible } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingStep } from '@/lib/onboarding-questions/types'

interface DynamicStepProps {
  step: OnboardingStep
}

export const DynamicStep: React.FC<DynamicStepProps> = ({ step }) => {
  const { control } = useFormContext()
  const values = useWatch({ control }) as Record<string, unknown>

  const ungroupedQuestions = (step.questions ?? []).filter((question) => isQuestionVisible(question, values))

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{step.description}</p>}
      </div>

      {(step.sections ?? []).map((section) => (
        <div key={section.key} className="space-y-4 rounded-lg border border-border p-4">
          {(section.title || section.description) && (
            <div className="space-y-1">
              {section.title && (
                <h3 className="inline-flex items-center gap-1.5 text-base font-semibold">
                  {section.title}
                  {section.helpText && <HelpTooltip text={section.helpText} />}
                </h3>
              )}
              {section.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{section.description}</p>}
            </div>
          )}

          {section.examples && section.examples.length > 0 && (
            <ul className="space-y-1">
              {section.examples.map((example) => (
                <li key={example} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="shrink-0 text-primary" />
                  {example}
                </li>
              ))}
            </ul>
          )}

          {section.questions
            .filter((question) => isQuestionVisible(question, values))
            .map((question) => (
              <DynamicQuestionField key={question.key} question={question} />
            ))}
        </div>
      ))}

      {ungroupedQuestions.map((question) => (
        <DynamicQuestionField key={question.key} question={question} />
      ))}
    </div>
  )
}
