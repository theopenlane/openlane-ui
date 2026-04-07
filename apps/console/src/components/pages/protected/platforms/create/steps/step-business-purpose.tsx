'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'

const StepBusinessPurpose: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Next to skip.</p>

      <FormField
        control={form.control}
        name="businessPurpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Purpose</FormLabel>
            <FormControl>
              <PlateEditor onChange={(val) => field.onChange(val)} initialValue={field.value as Value | string | undefined} placeholder="Describe the business purpose of this platform..." />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default StepBusinessPurpose
