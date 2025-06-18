import Slider from '@/components/shared/slider/slider'
import { MappedControlMappingType } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'

const relationTypes = [
  { label: 'Equal', value: MappedControlMappingType.EQUAL },
  { label: 'Subset', value: MappedControlMappingType.SUBSET },
  { label: 'Intersection', value: MappedControlMappingType.INTERSECT },
  { label: 'Partial', value: MappedControlMappingType.PARTIAL },
  { label: 'Superset', value: MappedControlMappingType.SUPERSET },
]

const MapControlsRelations = () => {
  const { control, setValue } = useFormContext()

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <Label className="block text-sm font-medium">Relation type</Label>
        <Controller
          name="mappingType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Intersection" />
              </SelectTrigger>
              <SelectContent>
                {relationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium">Confidence (0-100%)</Label>
        <Controller
          name="confidence"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-4">
              <Slider value={field.value ?? 0} onChange={(val) => field.onChange(val)} />
              <p className="text-blue-500 cursor-pointer" onClick={() => setValue('confidence', 0)}>
                Clear
              </p>
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Relation</label>
        <Controller name="relation" control={control} render={({ field }) => <Textarea placeholder="Add description..." rows={4} value={field.value ?? ''} onChange={field.onChange} />} />{' '}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Set</Button>
        <Button type="button" variant="back">
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default MapControlsRelations
