'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { type IntegrationProvider } from '@/lib/integrations/types'
import { GuideStepGroups, type GuideLiveValues, getProviderSetupGuide } from '@/lib/integrations/setup-guide-content'
import { SchemaField, type FieldEntry, type FormValues, type SchemaSection, buildFieldEntries, getResolvedSchemaFields } from './schema-form'
import ProviderIcon from './provider-icon'

type WizardStep = {
  prefix: string
  sectionTitle: string
  entry: FieldEntry
}

type IntegrationSetupWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: IntegrationProvider
  connectionLabel?: string
  credentialSections: SchemaSection[]
  userInputSections: SchemaSection[]
  isAuth: boolean
  isSubmitting: boolean
  formMethods: UseFormReturn<FormValues>
  onSubmit: (values: Record<string, unknown>) => void
  closeSignal: number
  liveValues?: GuideLiveValues
}

const IntegrationSetupWizard = ({
  open,
  onOpenChange,
  provider,
  connectionLabel,
  credentialSections,
  userInputSections,
  isAuth,
  isSubmitting,
  formMethods,
  onSubmit,
  closeSignal,
  liveValues,
}: IntegrationSetupWizardProps) => {
  const { trigger, handleSubmit } = formMethods
  const guide = getProviderSetupGuide(provider, connectionLabel, liveValues)

  const steps = useMemo<WizardStep[]>(
    () =>
      [...credentialSections, ...userInputSections].flatMap((section) =>
        buildFieldEntries(getResolvedSchemaFields(section.schema)).map((entry) => ({ prefix: section.prefix, sectionTitle: section.title, entry })),
      ),
    [credentialSections, userInputSections],
  )

  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setStepIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (closeSignal === -1) {
      onOpenChange(false)
    }
  }, [closeSignal, onOpenChange])

  if (!open || steps.length === 0) {
    return null
  }

  const clampedIndex = Math.min(stepIndex, steps.length - 1)
  const step = steps[clampedIndex]
  const isLastStep = clampedIndex === steps.length - 1
  const fieldsInStep = step.entry.type === 'field' ? [step.entry.field] : step.entry.fields
  const fieldNames = fieldsInStep.map(({ fieldKey }) => `${step.prefix}${fieldKey}`)
  // Only group steps need a heading, since SchemaField has no group-level label of its own.
  const stepTitle = step.entry.type === 'group' ? step.entry.groupLabel : undefined

  const handleNext = async () => {
    const valid = await trigger(fieldNames)
    if (!valid) {
      return
    }
    if (isLastStep) {
      handleSubmit(onSubmit)()
      return
    }
    setStepIndex((i) => i + 1)
  }

  const handleBack = () => setStepIndex((i) => Math.max(0, i - 1))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[92vw] p-0 overflow-hidden" overlayClassName="backdrop-blur-xs">
        <div className="flex max-h-[80vh] flex-col md:flex-row">
          {guide ? (
            <div className="md:w-[52%] shrink-0 border-b md:border-b-0 md:border-r bg-muted/30 p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative w-6 h-6 shrink-0 border rounded-full flex items-center justify-center overflow-hidden bg-background">
                  <ProviderIcon providerName={provider.displayName} logoUrl={provider.logoUrl} className="object-contain w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-text-header">Getting your values</h4>
              </div>
              {guide.intro ? <p className="mb-4 text-sm text-muted-foreground">{guide.intro}</p> : null}
              <div className="flex flex-col gap-4">
                <GuideStepGroups guide={guide} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col p-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set up {provider.displayName}</DialogTitle>
              {connectionLabel ? <p className="text-xs text-muted-foreground">{connectionLabel}</p> : null}
              <DialogDescription>
                {step.sectionTitle} · Step {clampedIndex + 1} of {steps.length}
              </DialogDescription>
            </DialogHeader>

            <div className="h-1 w-full rounded-full bg-muted overflow-hidden mt-4">
              <div className="h-full bg-brand transition-all duration-300" style={{ width: `${((clampedIndex + 1) / steps.length) * 100}%` }} />
            </div>

            {stepTitle ? (
              <div className="flex flex-col gap-1 py-4">
                <h4 className="text-sm font-semibold text-text-header">{stepTitle}</h4>
              </div>
            ) : (
              <div className="py-2" />
            )}

            <div className="flex-1 space-y-3">
              {fieldsInStep.map(({ fieldKey, property, required }) => (
                <SchemaField key={`${step.prefix}${fieldKey}`} fieldKey={fieldKey} fieldName={`${step.prefix}${fieldKey}`} property={property} required={required} />
              ))}
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="secondary" icon={<ArrowLeft className="h-4 w-4" />} iconPosition="left" onClick={handleBack} disabled={clampedIndex === 0}>
                Back
              </Button>
              <Button type="button" icon={isLastStep ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />} onClick={handleNext} disabled={isSubmitting}>
                {isLastStep ? (isSubmitting ? 'Saving...' : isAuth ? 'Continue to Authorization' : 'Save & Connect') : 'Next'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default IntegrationSetupWizard
