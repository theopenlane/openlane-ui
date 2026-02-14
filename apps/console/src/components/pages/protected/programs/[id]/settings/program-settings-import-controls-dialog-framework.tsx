'use client'
import { useGetStandards } from '@/lib/graphql-hooks/standard'
import { ControlWhereInput, Standard } from '@repo/codegen/src/schema'
import React, { useMemo, useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { statCardStyles } from '@/components/shared/stats-cards/stats-cards-styles'
import { Hourglass } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { Input } from '@repo/ui/input'
import { SelectedItem, TSharedImportControlsComponentsPropsFrameworks } from '../shared/program-settings-import-controls-shared-props'
import { getColumnsForImportControlsDialogFramework } from '../program-tasks-table/columns'
import { TableKeyEnum } from '@repo/ui/table-key'

const ImportControlsDialogFramework = ({ setSelectedItems, selectedItems, selectedFrameworkIds, setSelectedFrameworkIds }: TSharedImportControlsComponentsPropsFrameworks) => {
  const { data } = useGetStandards({})

  const [showCheckboxes, setShowCheckboxes] = useState<boolean>(false)
  const frameworks = [...(data?.standards?.edges?.map((edge) => edge?.node as Standard) || [])]
  const { wrapper, content } = statCardStyles({ color: 'green' })
  const [customSelected, setCustomSelected] = useState(false)

  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.PROGRAM_SETTINGS_IMPORT_CONTROLS, {
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    }),
  )

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const where: ControlWhereInput = useMemo(() => {
    const whereFilters: ControlWhereInput[] = []
    if (selectedFrameworkIds.length > 0) whereFilters.push({ standardIDIn: selectedFrameworkIds })
    if (debouncedSearchQuery) {
      whereFilters.push({
        or: [
          { refCodeContainsFold: debouncedSearchQuery },
          { categoryContainsFold: debouncedSearchQuery },
          { subcategoryContainsFold: debouncedSearchQuery },
          { descriptionContainsFold: debouncedSearchQuery },
        ],
      })
    }
    if (whereFilters.length === 0) return {}
    if (whereFilters.length === 1) return whereFilters[0]
    return { and: whereFilters }
  }, [selectedFrameworkIds, debouncedSearchQuery])

  const handleToggle = (id: string) => {
    setSelectedFrameworkIds((prev) => (prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]))
  }
  const { allControls } = useAllControlsGroupedWithListFields({ where: { ...where, ownerIDIsNil: true } as ControlWhereInput, enabled: selectedFrameworkIds.length > 0 })
  const customControlsData = useAllControlsGroupedWithListFields({ where: { referenceFrameworkIsNil: true } })
  const customControls = customControlsData.allControls
  const handleCheckboxShowToggle = () => {
    setShowCheckboxes((prev) => (prev = !prev))
  }

  const tableData: SelectedItem[] = useMemo(() => {
    const frameworkControls = allControls.map((control) => ({
      id: control.id,
      name: control.refCode,
      source: control.referenceFramework || undefined,
    }))
    const customControlsMap = customSelected
      ? customControls.map((control) => ({
          id: control.id,
          name: control.refCode,
          source: control.referenceFramework || undefined,
        }))
      : []
    return [...frameworkControls, ...customControlsMap]
  }, [allControls, customControls, customSelected])

  const pagedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return tableData.slice(start, start + pagination.pageSize)
  }, [tableData, pagination.page, pagination.pageSize])

  const columns = useMemo(() => {
    return getColumnsForImportControlsDialogFramework({ selectedItems, setSelectedItems, tableData })
  }, [selectedItems, setSelectedItems, tableData])

  return (
    <>
      <Button onClick={handleCheckboxShowToggle} variant="secondary" className="w-[200px] min-w-16 h-8 pt-[6px] pr-2 pb-[6px] pl-2">
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
              <div className="flex flex-wrap gap-4">
                {frameworks.map((framework) => (
                  <div key={framework.id} className="flex items-center space-x-2">
                    <Checkbox id={framework.id} checked={selectedFrameworkIds.includes(framework.id)} onCheckedChange={() => handleToggle(framework.id)} />
                    <Label htmlFor={framework.id} className="text-sm">
                      {framework.shortName ?? framework.name}
                    </Label>
                  </div>
                ))}
                {!!customControls.length && (
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={customSelected} onCheckedChange={() => setCustomSelected((prev) => !prev)} />
                    <Label className="text-sm">{'CUSTOM'}</Label>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <div>
        <Label>Search</Label>
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type" className="h-10 w-[200px] mt-1" />
      </div>
      <DataTable
        columns={columns}
        data={pagedData}
        paginationMeta={{ totalCount: tableData.length }}
        pagination={pagination}
        onPaginationChange={setPagination}
        stickyDialogHeader
        tableKey={TableKeyEnum.PROGRAM_SETTINGS_IMPORT_CONTROLS}
      />
    </>
  )
}

export default ImportControlsDialogFramework
