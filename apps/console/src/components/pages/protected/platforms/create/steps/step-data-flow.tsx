'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { usePlateHydration } from '@/components/shared/plate/usePlateHydration'
import { type Value } from 'platejs'

const StepDataFlow: React.FC = () => {
  const form = useFormContext<EditPlatformFormData>()
  const hydrate = usePlateHydration(form)

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="dataFlowSummary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data Flow Summary</FormLabel>
            <FormControl>
              <PlateEditor
                onChange={field.onChange}
                onHydrate={hydrate(field.name)}
                initialValue={field.value as Value | string | undefined}
                placeholder="Describe how data flows through this platform..."
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default StepDataFlow
