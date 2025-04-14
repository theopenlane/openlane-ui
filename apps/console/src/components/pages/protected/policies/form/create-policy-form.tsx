'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Info, InfoIcon } from 'lucide-react'
import React from 'react'
import useFormSchema, { CreatePolicyFormData } from '@/components/pages/protected/policies/hooks/use-form-schema.ts'
import StatusCard from '@/components/pages/protected/policies/cards/status-card.tsx'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from '@udecode/plate-common'
import AssociationCard from '@/components/pages/protected/policies/cards/association-card.tsx'
import TagsCard from '@/components/pages/protected/policies/cards/tags-card.tsx'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { Button } from '@repo/ui/button'
import { useCreateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import { CreateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePolicy } from '@/components/pages/protected/policies/hooks/use-policy.tsx'
import { useRouter } from 'next/navigation'

const CreatePolicyForm = () => {
  const { form } = useFormSchema()
  const router = useRouter()
  const { mutateAsync: createPolicy, isPending: isSubmitting } = useCreateInternalPolicy()
  const plateEditorHelper = usePlateEditor()
  const { successNotification, errorNotification } = useNotification()
  const associationsState = usePolicy((state) => state.associations)

  const onSubmitHandler = async (data: CreatePolicyFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: { input: CreateInternalPolicyInput } = {
        input: {
          ...data,
          details: detailsField,
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          ...associationsState,
        },
      }

      await createPolicy(formData)

      successNotification({
        title: 'Policy Created',
        description: 'Policy has been successfully created',
      })

      form.reset()
      router.push(`/policies`)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the policy. Please try again.',
      })
    }
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Not sure what to write?</AlertTitle>
            <AlertDescription>
              <p>
                For template library and help docs, please refer to our{' '}
                <a className="text-blue-600" href="https://docs.theopenlane.io/docs/category/policies-and-procedures" target="_blank">
                  documentation
                </a>
                .
              </p>
            </AlertDescription>
          </Alert>
          {/* Title Field */}
          <InputRow className="w-full">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex items-center">
                    <FormLabel>Title</FormLabel>
                    <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the policy later.</p>} />
                  </div>
                  <FormControl>
                    <Input variant="medium" {...field} className="w-full" />
                  </FormControl>
                  {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                </FormItem>
              )}
            />
          </InputRow>

          {/* details Field */}
          <InputRow className="w-full">
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Policy</FormLabel>
                  <SystemTooltip
                    icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                    content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                  />
                  <PlateEditor onChange={handleDetailsChange} variant="basic" />
                  {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                </FormItem>
              )}
            />
          </InputRow>

          <Button className="mt-4" type="submit" variant="filled" disabled={isSubmitting}>
            {isSubmitting ? 'Creating policy' : 'Create Policy'}
          </Button>
        </div>
        <div className="space-y-4">
          <StatusCard form={form} />
          <AssociationCard />
          <TagsCard form={form} />
        </div>
      </form>
    </Form>
  )
}

export default CreatePolicyForm
