import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import React, { useEffect, useState } from 'react'

interface Props {
  /** Called whenever any filter changes, passing a new `where` condition */
  onFilterChange: (where: Record<string, any>) => void
  where: Record<string, any>
}

const MapControlsFormFilters: React.FC<Props> = ({ onFilterChange, where }) => {
  const { standardOptions } = useStandardsSelect({})

  // Initialize local state from where prop
  const [standard, setStandard] = useState<string>(where.standardID || 'all')
  const [category, setCategory] = useState<string>(where.categoryContainsFold || '')
  const [keyword, setKeyword] = useState<string>('') // Can't derive keyword from where.or

  const categories = ['Security', 'Privacy', 'Risk']

  // Set initial keyword if possible (this is tricky because of the or condition)
  useEffect(() => {
    if (where.or) {
      const orCondition = where.or[0]
      if (orCondition.categoryContainsFold === orCondition.subcategoryContainsFold && orCondition.categoryContainsFold === orCondition.refCodeContainsFold) {
        setKeyword(orCondition.categoryContainsFold)
      }
    }
  }, [where.or])

  // Assemble `where` condition whenever filters update
  useEffect(() => {
    const newWhere: Record<string, any> = {}

    if (standard && standard !== 'all') {
      newWhere.standardID = standard
    }

    if (category) {
      newWhere.categoryContainsFold = category
    }

    if (keyword) {
      newWhere.or = [
        {
          categoryContainsFold: keyword,
          subcategoryContainsFold: keyword,
          refCodeContainsFold: keyword,
        },
      ]
    }

    onFilterChange(newWhere)
  }, [standard, category, keyword, onFilterChange])

  return (
    <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 items-center mb-4">
      <label className="text-sm font-medium">Framework</label>
      <Select onValueChange={setStandard} value={standard}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {standardOptions.map((opt, i) => (
            <SelectItem key={i} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="text-sm font-medium">Category</label>
      <Select onValueChange={setCategory} value={category}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Category" />
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
      <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search by keyword" />
    </div>
  )
}

export default MapControlsFormFilters
