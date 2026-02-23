'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronRight, ChevronsDownUp, List, SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useParams, useRouter } from 'next/navigation'
import { useDebounce } from '@uidotdev/usehooks'
import { ControlListStandardFieldsFragment, ControlWhereInput } from '@repo/codegen/src/schema'
import { canEdit } from '@/lib/authz/utils.ts'
import { TPermissionData } from '@/types/authz'
import { DataTable } from '@repo/ui/data-table'
import { getColumns } from './columns'
import AddToOrganizationDialog from './add-to-organization-dialog'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { VisibilityState } from '@tanstack/react-table'
import ControlDetailsSheet from './control-details-sheet'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TableKeyEnum } from '@repo/ui/table-key'

const generateWhere = (id: string, searchValue: string) => ({
  and: [
    { ownerIDIsNil: true },
    { standardID: id },
    {
      or: [{ refCodeContainsFold: searchValue }, { categoryContainsFold: searchValue }, { subcategoryContainsFold: searchValue }, { descriptionContainsFold: searchValue }],
    },
  ],
})

type TStandardDetailsAccordionProps = {
  standardName?: string | undefined
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
  isDialogOpen: boolean
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  permission: TPermissionData | undefined
  isLoadingPermission: boolean
}
const StandardDetailsAccordion: React.FC<TStandardDetailsAccordionProps> = ({
  standardName,
  selectedControls,
  setSelectedControls,
  isDialogOpen,
  setIsDialogOpen,
  permission,
  isLoadingPermission,
}) => {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [hasInitialized, setHasInitialized] = useState(false)
  const [paginations, setPaginations] = useState<Record<string, TPagination>>({})

  const [openSections, setOpenSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { push } = useRouter()
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const where = generateWhere(id, debouncedSearchQuery)
  const hasFilters = Object.keys(where).length > 0
  const allControls = useAllControlsGroupedWithListFields({ where: where as ControlWhereInput, enabled: hasFilters })
  const { convertToReadOnly } = usePlateEditor()

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
  })

  const groupedControls = useMemo(() => {
    const controlsList = allControls?.allControls ?? []

    if (!controlsList || controlsList.length === 0) return {}

    return controlsList.reduce<Record<string, ControlListStandardFieldsFragment[]>>((acc, control) => {
      const category = control.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(control)
      return acc
    }, {})
  }, [allControls])

  const toggleSelection = useCallback(
    (control: { id: string; refCode: string }) => {
      setSelectedControls((prev) => {
        const exists = prev.some((c) => c.id === control.id)
        return exists ? prev.filter((c) => c.id !== control.id) : [...prev, control]
      })
    },
    [setSelectedControls],
  )

  useEffect(() => {
    if (!isLoadingPermission) {
      const canEditPermission = canEdit(permission?.roles)

      setColumnVisibility((prev) => ({
        ...prev,
        select: canEditPermission,
      }))
    }
  }, [isLoadingPermission, permission])

  const columnsByCategory = useMemo(() => {
    return Object.fromEntries(
      Object.entries(groupedControls).map(([category, controls]) => {
        const columns = getColumns({
          selectedControls,
          toggleSelection,
          setSelectedControls,
          controls,
          convertToReadOnly,
        })
        return [category, columns]
      }),
    )
  }, [groupedControls, selectedControls, setSelectedControls, toggleSelection, convertToReadOnly])

  const allSectionKeys = useMemo(() => Object.keys(groupedControls), [groupedControls])

  const toggleAllSections = () => {
    const hasAllOpen = allSectionKeys.every((section) => openSections.includes(section))
    setOpenSections(hasAllOpen ? [] : allSectionKeys)
  }

  useEffect(() => {
    setPaginations((prev) => {
      const newPaginations = { ...prev }
      let hasChanged = false

      Object.keys(groupedControls).forEach((category) => {
        if (!newPaginations[category]) {
          newPaginations[category] = DEFAULT_PAGINATION
          hasChanged = true
        }
      })

      return hasChanged ? newPaginations : prev
    })
  }, [groupedControls])

  useEffect(() => {
    if (hasInitialized) return

    const firstCategory = Object.keys(groupedControls)[0]
    if (firstCategory) {
      setOpenSections([firstCategory])
      setHasInitialized(true)
    }
  }, [groupedControls, hasInitialized])

  const getPaginatedControls = (category: string, controls: ControlListStandardFieldsFragment[]) => {
    const pagination = paginations[category] || DEFAULT_PAGINATION
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize

    return controls.slice(start, end)
  }

  const handlePaginationChange = (category: string, newPagination: TPagination) => {
    setPaginations((prev) => ({
      ...prev,
      [category]: newPagination,
    }))
  }

  const handleRowClick = (row: ControlListStandardFieldsFragment) => {
    push(`/standards/${id}?controlId=${row.id}`)
  }

  return (
    <div className="relative">
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
        <div className="flex gap-2.5 items-center justify-between right-0 mt-2">
          <div className="flex col gap-2.5 items-center justify-between">
            <p className="">Domains</p>
            <Button type="button" className="h-8 !px-2" variant="secondary" onClick={toggleAllSections}>
              <div className="flex">
                <List size={16} />
                <ChevronsDownUp size={16} />
              </div>
            </Button>
          </div>
          <div className="flex col gap-2.5 items-center justify-between pr-2">
            <Input
              value={searchQuery}
              name="standardSearch"
              placeholder="Search ..."
              onChange={(e) => {
                const newValue = e.target.value
                setSearchQuery(newValue)
                setPaginations((prev) => {
                  const updated: Record<string, TPagination> = {}
                  for (const category of Object.keys(groupedControls)) {
                    updated[category] = {
                      ...DEFAULT_PAGINATION,
                      pageSize: prev[category]?.pageSize || DEFAULT_PAGINATION.pageSize,
                    }
                  }
                  return updated
                })
              }}
              icon={<SearchIcon size={16} />}
              iconPosition="left"
              variant="searchTable"
            />
          </div>
        </div>

        {Object.entries(groupedControls).map(([category, controls]) => {
          const columns = columnsByCategory[category]
          const isOpen = openSections.includes(category)
          return (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold w-full pr-4 pb-4 pt-4 cursor-pointer rounded-lg bg-unset">
                <span>{category}</span>
                {isOpen ? <ChevronDown size={22} className="text-brand" /> : <ChevronRight size={22} className="text-brand" />}
              </AccordionTrigger>
              <AccordionContent>
                <div className="">
                  <DataTable
                    loading={allControls.isLoading}
                    columns={columns}
                    data={getPaginatedControls(category, controls)}
                    paginationMeta={{
                      totalCount: controls.length,
                    }}
                    onRowClick={handleRowClick}
                    pagination={paginations[category] ?? DEFAULT_PAGINATION}
                    columnVisibility={columnVisibility}
                    onPaginationChange={(newPagination) => handlePaginationChange(category, newPagination)}
                    stickyHeader
                    tableKey={TableKeyEnum.STANDARD_DETAILS_ACCORDION}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <AddToOrganizationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        standardId={selectedControls.length === 0 ? id : undefined}
        selectedControls={selectedControls.length > 0 ? selectedControls : []}
        standardName={selectedControls.length === 0 ? standardName : undefined}
      />
      <ControlDetailsSheet />
    </div>
  )
}

export default StandardDetailsAccordion
