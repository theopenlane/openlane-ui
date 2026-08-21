'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { type TFormData } from './use-form-schema'
import { ControlImplementationFields } from './control-implementation-fields'
import { useCreateControlImplementation, useDeleteControlImplementation, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Callout } from '@/components/shared/callout/callout'
import { DocsSourceLink } from '@/components/shared/docs-help/suggestion-card'
import { docsHelpQuery } from '@/components/shared/docs-help/docs-help-query'

export const CreateControlImplementationForm = ({
  onSuccess,
  onClose,
  defaultValues,
  form,
}: {
  onSuccess: () => void
  onClose: () => void
  defaultValues?: Partial<TFormData>
  form: UseFormReturn<TFormData>
}) => {
  const { id, subcontrolId } = useParams()
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues
  const isSubcontrol = !!subcontrolId
  const { convertToHtml } = usePlateEditor()
  const { handleSubmit } = form

  const { mutate: createImplementation } = useCreateControlImplementation()
  const { mutate: updateImplementation } = useUpdateControlImplementation()
  const { mutate: deleteImplementation } = useDeleteControlImplementation()

  const handleDelete = () => {
    if (defaultValues?.id) {
      deleteImplementation(
        { deleteControlImplementationId: defaultValues.id },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Implementation deleted' })
            onSuccess()
          },
          onError: () => {
            errorNotification({
              title: 'Delete failed',
              description: 'Could not delete control implementation. Please try again.',
            })
          },
        },
      )
    }
  }

  const onSubmit = async (data: TFormData) => {
    const details = typeof data.details === 'string' ? data.details || undefined : data.details ? await convertToHtml(data.details) : undefined

    const basePayload = {
      ...data,
      details,
    }

    if (isEditing) {
      updateImplementation(
        {
          updateControlImplementationId: defaultValues.id || '',
          input: basePayload,
        },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Implementation updated' })
            onSuccess()
          },
          onError: () => {
            errorNotification({
              title: 'Update failed',
              description: 'Could not update control implementation. Please try again.',
            })
          },
        },
      )
    } else {
      createImplementation(
        {
          ...basePayload,
          ...(isSubcontrol ? { subcontrolIDs: [subcontrolId as string] } : { controlIDs: [id as string] }),
        },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Implementation created' })
            onSuccess()
          },
          onError: () => {
            errorNotification({
              title: 'Create failed',
              description: 'Could not create control implementation. Please try again.',
            })
          },
        },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <SheetHeader className="flex-row items-center">
        {!isEditing && <SheetTitle className="text-left text-lg">Control Implementation</SheetTitle>}
        <div className="ml-auto flex gap-2">
          {isEditing ? (
            <>
              <SaveButton />
              <CancelButton onClick={onClose}></CancelButton>
              <Button variant="destructive" className="h-8 px-4!" icon={<Trash2 />} iconPosition="left" type="button" onClick={handleDelete}>
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button className="h-8 px-4!">Create</Button>
              <CancelButton onClick={onClose}></CancelButton>
            </>
          )}
        </div>
      </SheetHeader>
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
