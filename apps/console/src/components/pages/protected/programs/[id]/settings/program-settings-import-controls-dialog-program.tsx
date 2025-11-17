'use client'

import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { SelectedItem, TSharedImportControlsComponentsPropsPrograms } from '../shared/program-settings-import-controls-shared-props'
import { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { ControlWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/controls'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { statCardStyles } from '@/components/shared/stats-cards/stats-cards-styles'
import { Hourglass } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { getColumnsForImportControlsDialogFramework } from '../program-tasks-table/columns'
import { useParams } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'

const ImportControlsDialogProgram = ({ setSelectedItems, selectedItems, selectedProgramIds, setSelectedProgramIds }: TSharedImportControlsComponentsPropsPrograms) => {
  const { id } = useParams<{ id: string | undefined }>()

  const { programOptions } = useProgramSelect(id ? { where: { idNEQ: id } } : {})
  const [showCheckboxes, setShowCheckboxes] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { wrapper, content } = statCardStyles({ color: 'green' })
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.PROGRAM_SETTINGS_IMPORT_CONTROLS_PROGRAM, {
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    }),
  )

  const where: ControlWhereInput = useMemo(() => {
    const initialWhereFilters: ControlWhereInput[] = [{ hasPrograms: true }]

    const whereFilters: ControlWhereInput[] = []
    if (selectedProgramIds.length > 0) whereFilters.push({ hasProgramsWith: [{ idIn: selectedProgramIds }] })
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
    const allFilters = [...initialWhereFilters, ...whereFilters]
    if (allFilters.length === 1) return allFilters[0]
    return { and: allFilters }
  }, [selectedProgramIds, debouncedSearchQuery])

  const handleToggle = (id: string) => {
    setSelectedProgramIds((prev) => (prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]))
  }
  const { allControls } = useAllControlsGroupedWithListFields({ where: where as ControlWhereInput, enabled: selectedProgramIds.length > 0 })
  const handleCheckboxShowToggle = () => {
    setShowCheckboxes((prev) => (prev = !prev))
  }

  const tableData: SelectedItem[] = useMemo(() => {
    if (!selectedProgramIds.length || !allControls) return []
    return allControls.map((control) => ({
      id: control.id,
      name: control.refCode,
      source: control.referenceFramework || undefined,
    }))
  }, [allControls, selectedProgramIds])

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
        {selectedProgramIds.length ? `${selectedProgramIds.length} programs selected` : 'Select program'}
      </Button>
      {showCheckboxes && (
        <Card className={wrapper()}>
          <CardContent className={content()}>
            {!programOptions ? (
              <div className="flex items-center gap-2 justify-start mt-5">
                <Hourglass size={24} strokeWidth={1} className="text-brand" />
                <span>No data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {programOptions.map((framework) => (
                  <div key={framework.value} className="flex items-center space-x-2">
                    <Checkbox id={framework.value} checked={selectedProgramIds.includes(framework.value)} onCheckedChange={() => handleToggle(framework.value)} />
                    <Label htmlFor={framework.value} className="text-sm">
                      {framework.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <div>
        <Label>Search</Label>
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Program" className="h-10 w-[200px] mt-1" />
      </div>
      <DataTable
        columns={columns}
        data={pagedData}
        paginationMeta={{ totalCount: tableData.length }}
        pagination={pagination}
        onPaginationChange={setPagination}
        stickyDialogHeader
        tableKey={TableKeyEnum.PROGRAM_SETTINGS_IMPORT_CONTROLS_PROGRAM}
      />
    </>
  )
}

export default ImportControlsDialogProgram
