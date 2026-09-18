'use client'

import { type UseFormReturn } from 'react-hook-form'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TFormData } from './use-form-schema'
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
  const { convertToHtml } = usePlateEditor()
  const { handleSubmit } = form

  const { mutateAsync: createImplementation } = useCreateControlImplementation()
  const { mutateAsync: updateImplementation } = useUpdateControlImplementation()

  const onSubmit = async (data: TFormData) => {
    const details = typeof data.details === 'string' ? data.details || undefined : data.details ? await convertToHtml(data.details) : undefined

    const basePayload = {
      ...data,
      details,
    }

    try {
      if (isEditing) {
        await updateImplementation({ updateControlImplementationId: defaultValues.id, input: basePayload })
        successNotification({ title: 'Control Implementation updated' })
      } else {
        await createImplementation({
          ...basePayload,
          ...(isSubcontrol ? { subcontrolIDs: [subcontrolId as string] } : { controlIDs: [id as string] }),
        })
        successNotification({ title: 'Control Implementation created' })
      }
      onSuccess()
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
