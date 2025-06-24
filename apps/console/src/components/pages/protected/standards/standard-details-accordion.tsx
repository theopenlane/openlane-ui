'use client'
import React, { useState, useMemo, useEffect } from 'react'
import type { FC } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronRight, ChevronsDownUp, List, SearchIcon, ShieldPlus } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useParams } from 'next/navigation'
import { useDebounce } from '@uidotdev/usehooks'
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'
import { canEdit } from '@/lib/authz/utils.ts'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { DataTable } from '@repo/ui/data-table'
import { getColumns } from './columns'
import AddToOrganizationDialog from './add-to-organization-dialog'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

const generateWhere = (id: string, searchValue: string) => ({
  and: [
    { standardID: id },
    {
      or: [{ refCodeContainsFold: searchValue }, { categoryContainsFold: searchValue }, { subcategoryContainsFold: searchValue }, { descriptionContainsFold: searchValue }],
    },
  ],
})

const StandardDetailsAccordion: FC = () => {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const [hasInitialized, setHasInitialized] = useState(false)
  const [paginations, setPaginations] = useState<Record<string, TPagination>>({})
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogCategory, setDialogCategory] = useState<string | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const where = generateWhere(id, debouncedSearchQuery)
  const { controls } = useGetAllControls({ where })
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

  const groupedControls = useMemo(() => {
    if (!controls || controls.length === 0) return {}

    return controls.reduce<Record<string, ControlListFieldsFragment[]>>((acc, control) => {
      const category = control.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(control)
      return acc
    }, {})
  }, [controls])

  const toggleSelection = (control: { id: string; refCode: string }) => {
    setSelectedControls((prev) => {
      const exists = prev.some((c) => c.id === control.id)
      return exists ? prev.filter((c) => c.id !== control.id) : [...prev, control]
    })
  }

  const columnsByCategory = useMemo(() => {
    return Object.fromEntries(
      Object.entries(groupedControls).map(([category, controls]) => {
        const columns = getColumns({
          selectedControls,
          toggleSelection,
          setSelectedControls,
          controls,
        })
        return [category, columns]
      }),
    )
  }, [groupedControls, selectedControls])

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

  const getPaginatedControls = (category: string, controls: ControlListFieldsFragment[]) => {
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

  return (
    <div className="relative">
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
        <div className="flex gap-2.5 items-center absolute right-0 mt-2">
          <Input
            value={searchQuery}
            name="standardSearch"
            placeholder="Search ..."
            onChange={(e) => {
              const newValue = e.target.value
              setSearchQuery(newValue)
              setPaginations((prev) => {
                const updated = { ...prev }
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
            className="!border-brand"
          />
          <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAllSections}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
        </div>
        {Object.entries(groupedControls).map(([category, controls]) => {
          const columns = columnsByCategory[category]
          const isOpen = openSections.includes(category)
          const selectedInCategory = selectedControls.filter((sel) => controls.some((c) => c.id === sel.id))
          const tableFooter =
            canEdit(permission?.roles) && selectedInCategory.length > 0 ? (
              <div className="flex justify-between items-center mt-3 p-2 border-t">
                <span>Add selected controls to Organization</span>
                <Button
                  icon={<ShieldPlus />}
                  iconPosition="left"
                  onClick={() => {
                    setDialogCategory(category)
                    setIsDialogOpen(true)
                  }}
                >
                  Add to Organization ({selectedInCategory.length})
                </Button>
              </div>
            ) : null
          return (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold w-full p-4 cursor-pointer rounded-lg">
                <span>{category}</span>
                {isOpen ? <ChevronDown size={22} className="text-brand" /> : <ChevronRight size={22} className="text-brand" />}
              </AccordionTrigger>
              <AccordionContent>
                <div className="">
                  <DataTable
                    columns={columns}
                    data={getPaginatedControls(category, controls)}
                    footer={tableFooter}
                    paginationMeta={{
                      totalCount: controls.length,
                    }}
                    pagination={paginations[category] ?? DEFAULT_PAGINATION}
                    onPaginationChange={(newPagination) => handlePaginationChange(category, newPagination)}
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
        selectedControls={dialogCategory ? selectedControls.filter((sel) => groupedControls[dialogCategory].some((c) => c.id === sel.id)) : []}
      />
    </div>
  )
}

export default StandardDetailsAccordion
