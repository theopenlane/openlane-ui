'use client'

import { type UseFormReturn } from 'react-hook-form'
import { useParams } from 'next/navigation'
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
import { Callout } from '@/components/shared/callout/callout'
import { DocsSourceLink } from '@/components/shared/docs-help/suggestion-card'
import { docsHelpQuery } from '@/components/shared/docs-help/docs-help-query'

export const CreateControlImplementationForm = ({
  formId,
  onSuccess,
  defaultValues,
  form,
}: {
  formId: string
  onSuccess: () => void
  defaultValues?: Partial<TFormData> & { id: string }
  form: UseFormReturn<TFormData>
}) => {
  const { id, subcontrolId } = useParams()
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues
  const isSubcontrol = !!subcontrolId
  const plateEditorHelper = usePlateEditor()
  const buildDirtyInput = useDirtyInput(form)
  const { handleSubmit } = form

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

    await createImplementation({
      ...data,
      details,
      ...(isSubcontrol ? { subcontrolIDs: [subcontrolId as string] } : { controlIDs: [id as string] }),
    })
    successNotification({ title: 'Control Implementation created' })
    onSuccess()
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
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEditing && (
        <Callout variant="info" title="Not sure what to write?">
          Add details about how this control is implemented in your environment. Include relevant tools, processes, teams involved, and how effectiveness is ensured.{' '}
          <DocsSourceLink label="Read more" topic={{ title: 'Control Implementation', query: docsHelpQuery('create', 'a control implementation'), prefer: 'Control Implementation' }} />
        </Callout>
      )}
      <ControlImplementationFields form={form} detailsInitialValue={defaultValues?.details} />
    </form>
  )
}
