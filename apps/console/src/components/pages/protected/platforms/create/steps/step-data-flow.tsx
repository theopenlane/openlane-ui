'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Textarea } from '@repo/ui/textarea'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

const StepDataFlow: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Next to skip.</p>

      <FormField
        control={form.control}
        name="dataFlowSummary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data Flow Summary</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe how data flows through this platform..." className="min-h-28" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="trustBoundaryDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trust Boundary Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the trust boundary for this platform..." className="min-h-28" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default StepDataFlow
