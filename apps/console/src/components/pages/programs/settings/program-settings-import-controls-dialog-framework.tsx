'use client'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { ControlWhereInput, Standard } from '@repo/codegen/src/schema'
import React, { useMemo, useState } from 'react'
import { SelectedItem } from './program-settings-import-controls-dialog'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { statCardStyles } from '@/components/shared/stats-cards/stats-cards-styles'
import { Hourglass } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { useAllControlsGrouped } from '@/lib/graphql-hooks/controls'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

type TFrameworkComponentProps = {
  selectedItems: SelectedItem[]
  setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>
}

// const generateWhere = (id: string[], searchValue: string) => ({
//   and: [
//     { standardIDIn: id },
//     {
//       or: [{ refCodeContainsFold: searchValue }, { categoryContainsFold: searchValue }, { subcategoryContainsFold: searchValue }, { descriptionContainsFold: searchValue }],
//     },
//   ],
// })

const ImportControlsDialogFramework: React.FC<TFrameworkComponentProps> = ({ setSelectedItems, selectedItems }) => {
  const { data } = useGetStandards({})

  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([])
  const [showCheckboxes, setShowCheckboxes] = useState<boolean>(false)
  const frameworks = data?.standards?.edges?.map((edge) => edge?.node as Standard) || []
  const { wrapper, content } = statCardStyles({ color: 'green' })
  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    page: 1,
    pageSize: 5,
    query: { first: 5 },
  })

  // const [searchQuery, setSearchQuery] = useState<string>('')
  // const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const where: ControlWhereInput = {}
  const handleToggle = (id: string) => {
    setSelectedFrameworkIds((prev) => (prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]))
  }
  const { allControls } = useAllControlsGrouped({ where: where as ControlWhereInput })
  const handleCheckboxShowToggle = () => {
    setShowCheckboxes((prev) => (prev = !prev))
  }

  const tableData: SelectedItem[] = useMemo(() => {
    return allControls.map((control) => ({
      id: control.id,
      name: control.refCode,
      source: control.referenceFramework ?? 'N/A',
    }))
  }, [allControls])

  const pagedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return tableData.slice(start, start + pagination.pageSize)
  }, [tableData, pagination.page, pagination.pageSize])

  const columns: ColumnDef<SelectedItem>[] = [
    {
      id: 'select',
      header: () => {
        const isAllSelected = pagedData.length > 0 && pagedData.every((item) => selectedItems.some((sel) => sel.id === item.id))
        const handleSelectAll = (checked: boolean) => {
          const pagedIds = new Set(pagedData.map((i) => i.id))

          setSelectedItems((prev) => {
            if (checked) {
              const newItems = pagedData.filter((item) => !prev.some((p) => p.id === item.id))
              return [...prev, ...newItems]
            } else {
              return prev.filter((item) => !pagedIds.has(item.id))
            }
          })
        }

        return <Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(!!checked)} />
      },
      cell: ({ row }) => {
        const item = row.original
        const isChecked = selectedItems.some((sel) => sel.id === item.id)

        const handleToggle = (checked: boolean) => {
          setSelectedItems((prev) => {
            if (checked) {
              if (prev.some((p) => p.id === item.id)) return prev
              return [...prev, item]
            } else {
              return prev.filter((sel) => sel.id !== item.id)
            }
          })
        }

        return <Checkbox checked={isChecked} onCheckedChange={(checked) => handleToggle(!!checked)} />
      },
      size: 50,
    },
    {
      accessorKey: 'name',
      header: 'Ref Code',
    },
    {
      accessorKey: 'source',
      header: 'Source',
    },
  ]
  return (
    <>
      <Button onClick={handleCheckboxShowToggle} variant="outline" className="h-8 !px-2 !pl-3">
        {selectedFrameworkIds.length ? `${selectedFrameworkIds.length} frameworks selected` : 'Select framework'}
      </Button>
      {showCheckboxes && (
        <Card className={wrapper()}>
          <CardContent className={content()}>
            {!frameworks ? (
              <div className="flex items-center gap-2 justify-start mt-5">
                <Hourglass size={24} strokeWidth={1} className="text-brand" />
                <span>No data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {frameworks.map((framework) => (
                  <div key={framework.id} className="flex items-center space-x-2">
                    <Checkbox id={framework.id} checked={selectedFrameworkIds.includes(framework.id)} onCheckedChange={() => handleToggle(framework.id)} />
                    <Label htmlFor={framework.id} className="text-sm">
                      {framework.shortName ?? framework.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <DataTable columns={columns} data={pagedData} paginationMeta={{ totalCount: tableData.length }} pagination={pagination} onPaginationChange={setPagination} />
    </>
  )
}

export default ImportControlsDialogFramework
