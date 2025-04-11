'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import React from 'react'
import useFormSchema from '@/components/pages/protected/policies/hooks/use-form-schema.ts'
import StatusCard from '@/components/pages/protected/policies/cards/status-card.tsx'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from '@udecode/plate-common'
import AssociationCard from '@/components/pages/protected/policies/cards/association-card.tsx'
import TagsCard from '@/components/pages/protected/policies/cards/tags-card.tsx'

const CreatePolicyForm = () => {
  const { form } = useFormSchema()

  const onSubmitHandler = () => {}

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
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
                  <FormLabel>Details</FormLabel>
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
        </div>
        <div className="space-y-4">
          <StatusCard form={form} />
          <AssociationCard />
          <TagsCard />
        </div>
      </form>
    </Form>
  )
}

export default CreatePolicyForm
