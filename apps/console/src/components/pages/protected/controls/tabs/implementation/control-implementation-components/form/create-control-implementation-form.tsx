'use client'

import { useMemo } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { useDirtyInput } from '@/hooks/useDirtyInput'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TFormData } from './use-form-schema'
import { CONTROL_IMPLEMENTATION_UPDATE_FIELDS } from './build-update-input'
import { type UpdateControlImplementationInput } from '@repo/codegen/src/schema'
import { ControlImplementationFields } from './control-implementation-fields'
import { useCreateControlImplementation, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { splitAssociationFields } from '@/components/shared/object-association/utils'
import { LINKABLE_CONTROL_TYPES } from '@/components/shared/object-association/association-configs'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { Callout } from '@/components/shared/callout/callout'
import { DocsSourceLink } from '@/components/shared/docs-help/suggestion-card'
import { docsHelpQuery } from '@/components/shared/docs-help/docs-help-query'

const CREATE_ASSOCIATION_KEYS = ['controlIDs', 'subcontrolIDs'] as const

export const CreateControlImplementationForm = ({
  formId,
  onSuccess,
  defaultValues,
  createDefaults,
  showControlPicker = false,
  form,
}: {
  formId: string
  onSuccess: (createdId?: string) => void
  defaultValues?: Partial<TFormData> & { id: string }
  createDefaults?: Partial<TFormData>
  showControlPicker?: boolean
  form: UseFormReturn<TFormData>
}) => {
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues
  const plateEditorHelper = usePlateEditor()
  const buildDirtyInput = useDirtyInput(form)
  const { handleSubmit } = form
  const initialAssociations = useMemo(() => ({ controlIDs: createDefaults?.controlIDs ?? [], subcontrolIDs: createDefaults?.subcontrolIDs ?? [] }), [createDefaults])

  const { mutateAsync: createImplementation } = useCreateControlImplementation()
  const { mutateAsync: updateImplementation } = useUpdateControlImplementation()

  const updateImplementationFromForm = async (implementationId: string, data: TFormData) => {
    const input = await buildDirtyInput<UpdateControlImplementationInput>(data, CONTROL_IMPLEMENTATION_UPDATE_FIELDS)

    if (Object.keys(input).length === 0) {
      form.reset()
      onSuccess()
      return
    }

    await updateImplementation({ updateControlImplementationId: implementationId, input })
    successNotification({ title: 'Control Implementation updated' })
    onSuccess()
  }

  const createImplementationFromForm = async (data: TFormData) => {
    const details = (await plateToHtmlOrNull(data.details, plateEditorHelper)) ?? undefined

    const { fields, associations } = splitAssociationFields(data, CREATE_ASSOCIATION_KEYS)

    const result = await createImplementation({ ...fields, ...associations, details })
    successNotification({ title: 'Control Implementation created' })
    onSuccess(result.createControlImplementation.controlImplementation.id)
  }

  const onSubmit = async (data: TFormData) => {
    try {
      if (isEditing) {
        await updateImplementationFromForm(defaultValues.id, data)
      } else {
        await createImplementationFromForm(data)
      }
    } catch (error) {
      errorNotification({ title: isEditing ? 'Update failed' : 'Create failed', description: parseErrorMessage(error) })
    }
  }

  return (
    <>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <Callout variant="info" title="Not sure what to write?">
            Add details about how this control is implemented in your environment. Include relevant tools, processes, teams involved, and how effectiveness is ensured.{' '}
            <DocsSourceLink label="Read more" topic={{ title: 'Control Implementation', query: docsHelpQuery('create', 'a control implementation'), prefer: 'Control Implementation' }} />
          </Callout>
        )}
        <ControlImplementationFields form={form} detailsInitialValue={(defaultValues ?? createDefaults)?.details} />
      </form>
      {showControlPicker && !isEditing && (
        <div className="mt-4 space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium">Linked Controls</p>
          <ObjectAssociation
            initialData={initialAssociations}
            defaultSelectedObject={ObjectTypeObjects.CONTROL}
            allowedObjectTypes={LINKABLE_CONTROL_TYPES}
            onIdChange={({ controlIDs, subcontrolIDs }) => {
              form.setValue('controlIDs', controlIDs ?? [], { shouldDirty: true })
              form.setValue('subcontrolIDs', subcontrolIDs ?? [], { shouldDirty: true })
            }}
          />
        </div>
      )}
    </>
  )
}
