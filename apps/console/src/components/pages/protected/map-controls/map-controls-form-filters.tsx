import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import React from 'react'

const MapControlsFormFilters = () => {
  const { standardOptions } = useStandardsSelect({})

  console.log('standardOptions', standardOptions)

  const frameworks = ['ISO 27001', 'NIST 800-53', 'NIST CSF', 'SOC 2']
  const categories = ['Security', 'Privacy', 'Risk']

  return (
    <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 items-center mb-4">
      <label className="text-sm font-medium">Framework</label>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {standardOptions.map((standardOption, i) => (
            <SelectItem key={i} value={standardOption.value}>
              {standardOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="text-sm font-medium">Category</label>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Security" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat.toLowerCase()}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="text-sm font-medium">Keyword</label>
      <Input />
    </div>
  )
}

export default MapControlsFormFilters
