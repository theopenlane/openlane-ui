'use client'

import { useEffect, useRef, useState } from 'react'
import { RemediationRemediationStatus } from '@repo/codegen/src/schema'
import useFormSchema, { type RemediationFormData } from './use-form-schema'
import { buildRemediationTitle, getRemediationContextRef, type TRemediation, type TRemediationContext, type TRemediationContextRef } from '../sheet/remediation-context'

type TAutofillField = 'title' | 'environmentName' | 'scopeName'

const AUTOFILL_FIELDS: TAutofillField[] = ['title', 'environmentName', 'scopeName']

export const buildEditDefaults = (remediation: TRemediation): RemediationFormData => {
  const contextRef = getRemediationContextRef(remediation)
  return {
    contextType: contextRef?.type,
    contextId: contextRef?.id,
    title: remediation.title ?? '',
    status: remediation.status ?? null,
    explanation: remediation.explanation ?? '',
    instructions: remediation.instructions ?? '',
    intent: remediation.intent ?? '',
    environmentName: remediation.environmentName ?? null,
    scopeName: remediation.scopeName ?? null,
    repositoryURI: remediation.repositoryURI ?? '',
    pullRequestURI: remediation.pullRequestURI ?? '',
    ticketReference: remediation.ticketReference ?? '',
    externalURI: remediation.externalURI ?? '',
    fileIDs: [],
    uploads: [],
  }
}

const buildCreateDefaults = (initialContext?: TRemediationContextRef, initialInstructions?: string): RemediationFormData => ({
  contextType: initialContext?.type,
  contextId: initialContext?.id,
  title: '',
  status: RemediationRemediationStatus.IN_PROGRESS,
  instructions: initialInstructions ?? '',
  fileIDs: [],
  uploads: [],
})

type TUseRemediationSheetFormArgs = {
  remediation?: TRemediation
  initialContext?: TRemediationContextRef
  initialInstructions?: string
}

export const useRemediationSheetForm = ({ remediation, initialContext, initialInstructions }: TUseRemediationSheetFormArgs) => {
  const [defaultValues] = useState(() => (remediation ? buildEditDefaults(remediation) : buildCreateDefaults(initialContext, initialInstructions)))
  return useFormSchema({ isCreate: !remediation, defaultValues })
}

export const useContextAutofill = (form: ReturnType<typeof useFormSchema>['form'], context: TRemediationContext | undefined, enabled: boolean) => {
  const autofilledRef = useRef<Partial<Record<TAutofillField, string>>>({})
  const appliedContextRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !context || appliedContextRef.current === context.id) {
      return
    }
    appliedContextRef.current = context.id

    const next: Record<TAutofillField, string> = {
      title: buildRemediationTitle(context.heading),
      environmentName: context.environmentName ?? '',
      scopeName: context.scopeName ?? '',
    }

    AUTOFILL_FIELDS.forEach((name) => {
      const current = form.getValues(name) ?? ''
      const untouched = !current || current === autofilledRef.current[name]
      if (untouched) {
        form.resetField(name, { defaultValue: next[name] })
        autofilledRef.current[name] = next[name]
      }
    })
  }, [enabled, context, form])
}
