'use client'

import React from 'react'
import { Form } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ArrowLeft } from 'lucide-react'
import useFormSchema, { type RemediationFormData } from './hooks/use-form-schema'
import { useCreateRemediation } from '@/lib/graphql-hooks/remediation'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import TitleField from './create/form/fields/title-field'
import { AdditionalFields } from './create/form/fields/additional-fields'

export const TRACK_REMEDIATION_FORM_ID = 'trackRemediationForm'

type EntityType = 'finding' | 'vulnerability'

type TrackRemediationFormProps = {
  entityId: string
  entityType: EntityType
  onClose: () => void
  onPendingChange?: (isPending: boolean) => void
  defaultTitle?: string
  defaultInstructions?: string
}

export const TrackRemediationForm: React.FC<TrackRemediationFormProps> = ({ entityId, entityType, onClose, onPendingChange, defaultTitle, defaultInstructions }) => {
  const { form } = useFormSchema()
  React.useEffect(() => {
    if (defaultTitle) {
      form.setValue('title', defaultTitle)
    }
    if (defaultInstructions) {
      form.setValue('instructions', defaultInstructions)
    }
  }, [defaultTitle, defaultInstructions, form])
  const { mutateAsync, isPending } = useCreateRemediation()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const enumOpts = { environmentOptions, scopeOptions }
  const enumCreateHandlers = { environmentName: createEnvironment, scopeName: createScope }

  const noopSetInternalEditing = () => {}

  React.useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  const onSubmit = async (data: RemediationFormData) => {
    try {
      const input = {
        ...data,
        ...(entityType === 'finding' ? { findingIDs: [entityId] } : { vulnerabilityIDs: [entityId] }),
      }
      await mutateAsync({ input })
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
      queryClient.invalidateQueries({ queryKey: [entityType === 'vulnerability' ? 'vulnerabilities' : 'findings', entityId, 'associations'] })
      successNotification({ title: 'Remediation Created', description: 'The remediation has been successfully created.' })
      onClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={TRACK_REMEDIATION_FORM_ID} className="space-y-6 mt-4 mr-6">
        <div className="mb-6">
          <TitleField isEditing={true} isEditAllowed={true} initialValue="" internalEditing={null} setInternalEditing={noopSetInternalEditing} />
        </div>
        <AdditionalFields
          isEditing={true}
          isEditAllowed={true}
          isCreate={true}
          internalEditing={null}
          setInternalEditing={noopSetInternalEditing}
          enumOptions={enumOpts}
          enumCreateHandlers={enumCreateHandlers}
        />
      </form>
    </Form>
  )
}

type TrackRemediationHeaderProps = {
  onBack: () => void
  isPending: boolean
}

export const TrackRemediationHeader: React.FC<TrackRemediationHeaderProps> = ({ onBack, isPending }) => {
  return (
    <SheetHeader>
      <SheetTitle className="sr-only">Track Remediation</SheetTitle>
      <div className="flex items-center justify-between">
        <Button variant="transparent" onClick={onBack} className="flex items-center gap-1 px-2">
          <ArrowLeft size={16} />
          Back
        </Button>
        <div className="flex gap-2 mr-6">
          <CancelButton disabled={isPending} onClick={onBack} />
          <SaveButton form={TRACK_REMEDIATION_FORM_ID} disabled={isPending} isSaving={isPending} title="Create" savingTitle="Creating..." />
        </div>
      </div>
    </SheetHeader>
  )
}
