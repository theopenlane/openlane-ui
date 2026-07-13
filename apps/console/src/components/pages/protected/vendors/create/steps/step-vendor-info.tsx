'use client'

import React, { useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { EntityEntityStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { MultiStringField } from '@/components/shared/crud-base/form-fields/multi-text-field'
import { deriveVendorNameFromDomain } from '../../hooks/use-suggested-vendor-logos'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

const StepVendorInfo: React.FC = () => {
  const form = useFormContext<EditVendorFormData>()
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const domains = form.watch('domains')
  const hasAutoFilledNameRef = useRef(false)

  useEffect(() => {
    if (hasAutoFilledNameRef.current) return
    const firstDomain = domains?.[0]
    if (!firstDomain || form.getValues('name')?.trim()) return
    const derivedName = deriveVendorNameFromDomain(firstDomain)
    if (!derivedName) return
    hasAutoFilledNameRef.current = true
    form.setValue('name', derivedName, { shouldValidate: true, shouldDirty: true })
  }, [domains, form])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Vendor Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Corp" {...field} />
              </FormControl>
              {form.formState.errors.name?.message && <p className="text-sm text-red-500">{String(form.formState.errors.name.message)}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Official Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Corporation Inc." {...field} />
              </FormControl>
              {form.formState.errors.displayName?.message && <p className="text-sm text-red-500">{String(form.formState.errors.displayName.message)}</p>}
            </FormItem>
          )}
        />
      </div>

      <MultiStringField
        name="domains"
        label="Domains"
        type="link"
        placeholder="example.com"
        tooltipContent="Domains associated with the vendor. Adding one lets us suggest a logo and auto-fills the name when it is empty."
        isEditing={false}
        isEditAllowed
        isCreate
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Brief description of the vendor and services" {...field} value={typeof field.value === 'string' ? field.value : ''} />
            </FormControl>
            {form.formState.errors.description?.message && <p className="text-sm text-red-500">{String(form.formState.errors.description.message)}</p>}
          </FormItem>
        )}
      />

      <MultiStringField name="providedServices" label="Provided Services" placeholder="Add service..." isEditing={false} isEditAllowed isCreate internalEditing={null} setInternalEditing={() => {}} />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {enumToOptions(EntityEntityStatus).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status?.message && <p className="text-sm text-red-500">{String(form.formState.errors.status.message)}</p>}
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
                <CreatableCustomTypeEnumSelect value={field.value} options={environmentOptions} onValueChange={field.onChange} onCreateOption={createEnvironment} placeholder="Select environment" />
              </FormControl>
              {form.formState.errors.environmentName?.message && <p className="text-sm text-red-500">{String(form.formState.errors.environmentName.message)}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect value={field.value ?? ''} options={scopeOptions} onValueChange={field.onChange} onCreateOption={createScope} placeholder="Select scope" />
              </FormControl>
              {form.formState.errors.scopeName?.message && <p className="text-sm text-red-500">{String(form.formState.errors.scopeName.message)}</p>}
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

export default StepVendorInfo
