import React, { useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetControlCategories } from '@/lib/graphql-hooks/control'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { ControlWhereInput } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { Option } from '@repo/ui/multiple-selector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Checkbox } from '@repo/ui/checkbox'
import { MapControl } from '@/types'

interface Props {
  onFilterChange: (where: ControlWhereInput) => void
  enableSubcontrols: boolean
  setEnableSubcontrols: (arg: boolean) => void
  oppositeControls: MapControl[]
}

const MapControlsFormFilters: React.FC<Props> = ({ onFilterChange, enableSubcontrols, setEnableSubcontrols, oppositeControls }) => {
  const { currentOrgId } = useOrganization()

  const [referenceFramework, setReferenceFramework] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const [categoryOpts, setCategoryOpts] = useState<Option[]>([])
  const selectedCategoryValues = useMemo(() => categoryOpts.map((o) => o.value), [categoryOpts])

  const { data } = useGetControlCategories({})
  const categories = data?.controlCategories ?? []

  const { standardOptions } = useStandardsSelect({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [{ id: currentOrgId }],
        },
      ],
    },
    enabled: Boolean(currentOrgId),
  })

  const excludedFrameworks = useMemo(() => {
    return new Set(oppositeControls.map((c) => c.referenceFramework).filter((f): f is string => Boolean(f) && f !== 'CUSTOM'))
  }, [oppositeControls])

  const filteredStandardOptions = useMemo(() => {
    return standardOptions.filter((opt) => !excludedFrameworks.has(opt.label))
  }, [standardOptions, excludedFrameworks])

  useEffect(() => {
    const where: ControlWhereInput = {}

    const excludedFrameworks = Array.from(new Set(oppositeControls.map((c) => c.referenceFramework).filter(Boolean))) as string[]

    if (referenceFramework && referenceFramework !== 'CUSTOM') {
      where.referenceFramework = referenceFramework
    } else if (referenceFramework === 'CUSTOM') {
      where.referenceFrameworkIsNil = true
    }

    const orClauses: ControlWhereInput[] = []

    for (const cat of selectedCategoryValues) {
      orClauses.push({ categoryContainsFold: cat })
    }

    if (debouncedKeyword) {
      orClauses.push({ categoryContainsFold: debouncedKeyword })
      orClauses.push({ subcategoryContainsFold: debouncedKeyword })
      orClauses.push({ refCodeContainsFold: debouncedKeyword })
    }

    if (orClauses.length) {
      if (!referenceFramework && excludedFrameworks.length > 0) {
        where.and = [
          {
            or: [{ referenceFrameworkIsNil: true }, { referenceFrameworkNotIn: excludedFrameworks }],
          },
          {
            or: orClauses,
          },
        ]
      } else {
        where.or = orClauses
      }
    }

    onFilterChange(where)
  }, [referenceFramework, debouncedKeyword, onFilterChange, selectedCategoryValues, oppositeControls])

  return (
    <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 items-center mb-4">
      <label className="text-sm font-medium">Framework</label>
      <Select onValueChange={setReferenceFramework} value={referenceFramework}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Framework" />
        </SelectTrigger>
        <SelectContent>
          {filteredStandardOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.label}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value="CUSTOM">CUSTOM</SelectItem>
        </SelectContent>
      </Select>

      <label className="text-sm font-medium">Category</label>
      <Select
        value={selectedCategoryValues[0] || ''}
        onValueChange={(value) => {
          if (!value) return
          setCategoryOpts([{ value, label: value }])
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a category..." />
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

      <label className="text-sm font-medium">Include Subcontrols</label>
      <Checkbox checked={enableSubcontrols} onCheckedChange={setEnableSubcontrols} />
      {(referenceFramework || categoryOpts.length > 0 || keyword) && (
        <div className="col-span-2 flex justify-end">
          <p
            onClick={() => {
              setReferenceFramework('')
              setCategoryOpts([])
              setKeyword('')
              onFilterChange({})
              setEnableSubcontrols(false)
            }}
            className="text-blue-500 cursor-pointer self-start"
          >
            Clear
          </p>
        </div>
      )}
    </div>
  )
}

export default MapControlsFormFilters
