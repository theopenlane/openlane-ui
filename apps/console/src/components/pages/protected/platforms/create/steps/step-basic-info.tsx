'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { PlatformPlatformStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

const StepBasicInfo: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Platform Name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="SaaS Product" {...field} />
            </FormControl>
            {form.formState.errors.name?.message && <p className="text-sm text-red-500">{String(form.formState.errors.name.message)}</p>}
          </FormItem>
        )}
      />

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
                {enumToOptions(PlatformPlatformStatus).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="businessPurpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Purpose</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the business purpose of this platform..." className="min-h-24" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default StepBasicInfo
