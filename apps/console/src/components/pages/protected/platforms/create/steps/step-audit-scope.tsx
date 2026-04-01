'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Switch } from '@repo/ui/switch'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

const StepAuditScope: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Next to skip.</p>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="scopeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect value={field.value ?? ''} options={scopeOptions} onValueChange={field.onChange} onCreateOption={createScope} placeholder="Select scope" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="environmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Environment</FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect
                  value={field.value ?? ''}
                  options={environmentOptions}
                  onValueChange={field.onChange}
                  onCreateOption={createEnvironment}
                  placeholder="Select environment"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="containsPii"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Contains PII</FormLabel>
              <p className="text-sm text-muted-foreground">This platform stores or processes personally identifiable information.</p>
            </div>
            <FormControl>
              <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default StepAuditScope
