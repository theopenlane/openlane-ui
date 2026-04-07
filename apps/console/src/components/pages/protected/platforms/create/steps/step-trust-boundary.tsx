'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'

const StepTrustBoundary: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="trustBoundaryDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trust Boundary Description</FormLabel>
            <FormControl>
              <PlateEditor onChange={(val) => field.onChange(val)} initialValue={field.value as Value | string | undefined} placeholder="Describe the trust boundary for this platform..." />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default StepTrustBoundary
