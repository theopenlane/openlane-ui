import { Controller, UseFormReturn } from 'react-hook-form'
import React from 'react'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { FormControl, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { PageHeading } from '@repo/ui/page-heading'

type TTitleFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditPolicyMetadataFormData>
}

const TitleField: React.FC<TTitleFieldProps> = ({ isEditing, form }) => {
  return isEditing ? (
    <div className="w-full">
      <Controller
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
    </div>
  ) : (
    <PageHeading heading={form.getValues('name')} />
  )
}

export default TitleField
