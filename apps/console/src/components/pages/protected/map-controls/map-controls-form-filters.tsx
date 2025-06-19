import React, { useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useAllControlsGrouped, useGetControlCategories } from '@/lib/graphql-hooks/controls'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { ControlWhereInput } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'

interface Props {
  onFilterChange: (where: ControlWhereInput) => void
}

const MapControlsFormFilters: React.FC<Props> = ({ onFilterChange }) => {
  const { currentOrgId } = useOrganization()

  const [referenceFramework, setReferenceFramework] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState<string>('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const [categoryOpts, setCategoryOpts] = useState<Option[]>([])
  const selectedCategoryValues = useMemo(() => categoryOpts.map((o) => o.value), [categoryOpts])

  const { data } = useGetControlCategories()
  const categories = data?.controlCategories ?? []

  const { standardOptions } = useStandardsSelect({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [
            {
              id: currentOrgId,
            },
          ],
        },
      ],
    },
    enabled: Boolean(currentOrgId),
  })

  useEffect(() => {
    const where: ControlWhereInput = {}

    if (referenceFramework && referenceFramework !== 'Custom') {
      where.referenceFramework = referenceFramework
    } else if (referenceFramework === 'Custom') {
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
      where.or = orClauses
    }

    onFilterChange(where)
  }, [referenceFramework, debouncedKeyword, onFilterChange, selectedCategoryValues])

  return (
    <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 items-center mb-4">
      <label className="text-sm font-medium">Framework</label>
      <Select onValueChange={setReferenceFramework} value={referenceFramework}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={'Custom'}>{'Custom'}</SelectItem>
          {standardOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.label}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="text-sm font-medium">Category</label>
      <MultipleSelector
        placeholder="Add or select category..."
        creatable
        className="w-full"
        commandProps={{ className: 'w-full' }}
        value={categoryOpts}
        options={categories.map((cat) => ({ value: cat.toLowerCase(), label: cat }))}
        onChange={(newOpts) => {
          setCategoryOpts(newOpts)
        }}
      />

      <label className="text-sm font-medium">Keyword</label>
      <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search by keyword" />
      {(referenceFramework || categoryOpts.length > 0 || keyword) && (
        <div className="col-span-2 flex justify-end">
          <p
            onClick={() => {
              setReferenceFramework('')
              setCategoryOpts([])
              setKeyword('')
              onFilterChange({})
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
