'use client'

import React, { useEffect } from 'react'
import { defineStepper } from '@stepperize/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateWorkflowDefinition, useWorkflowDefinitionsWithFilter } from '@/lib/graphql-hooks/workflow-definition'
import { useWorkflowMetadata } from '@/lib/graphql-hooks/workflows'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import type { CreateWorkflowDefinitionInput } from '@repo/codegen/src/schema'
import { WizardStepNav } from './wizard/nav'
import { useWizardState } from './wizard/hooks/use-wizard-state'
import { useTemplateLoader } from './wizard/hooks/use-template-loader'
import { FlowStep } from './wizard/steps/flow-step'
import { RulesStep } from './wizard/steps/rules-step'
import { ConfigureStep } from './wizard/steps/configure-step'
import { ReviewStep } from './wizard/steps/review-step'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const { useStepper } = defineStepper({ id: 'flow', label: 'Flow' }, { id: 'rules', label: 'Refine' }, { id: 'configure', label: 'Configure' }, { id: 'review', label: 'Review' })

type WorkflowWizardPageProps = {
  embedded?: boolean
}

const WorkflowWizardPage = ({ embedded = false }: WorkflowWizardPageProps) => {
  const stepper = useStepper()
  const { setCrumbs } = React.use(BreadcrumbContext)

  useEffect(() => {
    if (embedded) return
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Automation', href: '/automation/workflows' }, { label: 'Workflows', href: '/automation/workflows' }, { label: 'Wizard' }])
  }, [setCrumbs, embedded])
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const { successNotification, errorNotification } = useNotification()
  const baseCreateMutation = useCreateWorkflowDefinition()
  const { objectTypes, isLoading: isLoadingMetadata } = useWorkflowMetadata()
  const { workflowDefinitionsNodes } = useWorkflowDefinitionsWithFilter({ enabled: !templateId })
  const { userOptions } = useUserSelect({})
  const { groupOptions } = useGroupSelect()

  const state = useWizardState({
    objectTypes,
    workflowDefinitionsNodes,
    userOptions,
    groupOptions,
  })

  useTemplateLoader({ templateId, state, goToStep: (id) => stepper.goTo(id as 'flow' | 'rules' | 'configure' | 'review') })

  const currentStepError = state.getValidationError(stepper.current.id)
  const canContinue = !currentStepError

  const handleBack = () => {
    if (stepper.isFirst) {
      router.push('/automation/workflows')
      return
    }
    stepper.prev()
  }

  const handleNext = async () => {
    const error = state.getValidationError(stepper.current.id)
    if (error) {
      errorNotification({ title: 'Missing details', description: error })
      return
    }

    if (!stepper.isLast) {
      stepper.next()
      return
    }

    for (const step of ['flow', 'rules', 'configure', 'review'] as const) {
      const stepError = state.getValidationError(step)
      if (stepError) {
        errorNotification({ title: 'Missing details', description: stepError })
        stepper.goTo(step)
        return
      }
    }

    const finalName = state.name.trim() || state.suggestedName
    const workflowDocument = state.buildWorkflowDocument()

    if (!finalName) {
      errorNotification({ title: 'Workflow name is required' })
      return
    }

    if (!state.schemaType || !state.actionType) {
      errorNotification({ title: 'Missing workflow details' })
      return
    }

    const input: CreateWorkflowDefinitionInput = {
      name: finalName,
      description: state.description.trim() || undefined,
      schemaType: state.schemaType,
      workflowKind: state.workflowKind,
      active: state.active,
      draft: state.draft,
      isDefault: state.isDefault,
      cooldownSeconds: state.cooldownSeconds,
      definitionJSON: workflowDocument,
    }

    try {
      const response = await baseCreateMutation.mutateAsync({ input })
      const id = response?.createWorkflowDefinition?.workflowDefinition?.id

      successNotification({
        title: 'Workflow created',
        description: 'Your workflow has been saved successfully.',
      })

      if (id) {
        router.push(`/automation/workflows/definitions/${id}`)
        return
      }

      router.push('/automation/workflows')
    } catch (error) {
      errorNotification({
        title: 'Unable to save workflow',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <div className="max-w-8xl mx-auto px-6 py-2">
      <p className="text-muted-foreground">Build a workflow in a few guided steps. Pick the object, trigger, and action, then configure the details.</p>
      <div className="py-6">
        <div className="space-y-6 flex justify-center w-full">
          <WizardStepNav
            stepper={stepper}
            enabledMap={{
              flow: true,
              rules: Boolean(state.schemaType && state.operationPicked),
              configure: Boolean(state.schemaType && state.operationPicked && state.actionType),
              review: Boolean(state.schemaType && state.operationPicked && state.actionType),
            }}
          />
        </div>
        <Separator className="mt-2 mb-4" />

        {stepper.switch({
          flow: () => <FlowStep state={state} isLoadingMetadata={isLoadingMetadata} />,
          rules: () => <RulesStep state={state} />,
          configure: () => <ConfigureStep state={state} />,
          review: () => <ReviewStep state={state} />,
        })}

        <div className={`flex items-center mt-8 ${embedded && stepper.isFirst ? 'justify-end' : 'justify-between'}`}>
          {!(embedded && stepper.isFirst) && (
            <Button type="button" variant="secondary" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button type="button" variant="primary" onClick={handleNext} disabled={!canContinue || baseCreateMutation.isPending} loading={baseCreateMutation.isPending}>
            {stepper.isLast ? 'Create workflow' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WorkflowWizardPage
