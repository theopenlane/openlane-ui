import Slider from '@/components/shared/slider/slider'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import React from 'react'

const MapControlsRelations = () => {
  const relationTypes = [
    { label: 'Equal', value: 'equal' },
    { label: 'Subset', value: 'subset' },
    { label: 'Intersection', value: 'intersection' },
    { label: 'Partial', value: 'partial' },
    { label: 'Superset', value: 'superset' },
  ]
  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Relation type</label>
        <Select>
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
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Confidence (0-100%)</label>
        <div className="flex items-center space-x-4">
          <Slider />
        </div>
        <p className="text-blue-500 cursor-pointer">Clear</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Relation</label>
        <Textarea placeholder="Add description..." rows={4} />
      </div>

      <div className="flex justify-end space-x-2">
        <Button>Set</Button>
        <Button variant="back">Cancel</Button>
      </div>
    </div>
  )
}

export default MapControlsRelations
