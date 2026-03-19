'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { EntityEntityStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

const StepVendorInfo: React.FC = () => {
  const form = useFormContext<EditVendorFormData>()

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
                <Input placeholder="e.g. Production" {...field} />
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
                <Input placeholder="e.g. SOC 2" {...field} value={field.value ?? ''} />
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
