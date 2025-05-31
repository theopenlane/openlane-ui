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
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const columns = useMemo(() => {
    return getColumns({ selectedControls, toggleSelection, setSelectedControls, controls })
  }, [selectedControls, controls])

  const allSectionKeys = useMemo(() => Object.keys(groupedControls), [groupedControls])

  const toggleAllSections = () => {
    const hasAllOpen = allSectionKeys.every((section) => openSections.includes(section))
    setOpenSections(hasAllOpen ? [] : allSectionKeys)
  }

  useEffect(() => {
    if (hasInitialized) return

    const firstCategory = Object.keys(groupedControls)[0]
    if (firstCategory) {
      setOpenSections([firstCategory])
      setHasInitialized(true)
    }
  }, [groupedControls, hasInitialized])

  const tableFooter =
    canEdit(permission?.roles) && selectedControls.length > 0 ? (
      <div className="flex justify-between items-center mt-3 p-2 border-t">
        <span>Add selected controls to Organization</span>
        <Button icon={<ShieldPlus />} iconPosition="left" onClick={() => setIsDialogOpen(true)}>
          Add to Organization ({selectedControls.length})
        </Button>
      </div>
    ) : null

  return (
    <div className="relative">
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
        <div className="flex gap-2.5 items-center absolute right-0 mt-2">
          <Input
            value={searchQuery}
            name="standardSearch"
            placeholder="Search ..."
            onChange={(e) => setSearchQuery(e.target.value)}
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
          const isOpen = openSections.includes(category)
          return (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold w-full p-4 cursor-pointer rounded-lg">
                <span>{category}</span>
                {isOpen ? <ChevronDown size={22} className="text-brand" /> : <ChevronRight size={22} className="text-brand" />}
              </AccordionTrigger>
              <AccordionContent>
                <div className="">
                  <DataTable columns={columns} data={controls} footer={tableFooter} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <AddToOrganizationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} selectedControls={selectedControls} />
    </div>
  )
}

export default StandardDetailsAccordion
