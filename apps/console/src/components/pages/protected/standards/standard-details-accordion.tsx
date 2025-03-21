'use client'
import React, { useState, useMemo } from 'react'
import type { FC } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Checkbox } from '@repo/ui/checkbox'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ChevronDown, ChevronRight, SearchIcon, ShieldPlus } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useParams } from 'next/navigation'
import { useDebounce } from '@uidotdev/usehooks'
import { ControlFieldsFragment } from '@repo/codegen/src/schema'
import { useGetAllPrograms } from '@/lib/graphql-hooks/programs'

const generateWhere = (id: string, searchValue: string) => ({
  and: [
    { standardID: id },
    {
      or: [{ refCodeContains: searchValue }, { categoryContains: searchValue }, { subcategoryContains: searchValue }, { descriptionContains: searchValue }],
    },
  ],
})

const StandardDetailsAccordion: FC = () => {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [selectedControls, setSelectedControls] = useState<string[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const where = generateWhere(id, debouncedSearchQuery)
  const { data } = useGetAllControls(where)
  const { data: programsData } = useGetAllPrograms()

  const groupedControls = useMemo(() => {
    if (!data?.controls?.edges) return {}

    return data.controls.edges.reduce<Record<string, ControlFieldsFragment[]>>((acc, edge) => {
      const control = edge?.node
      if (!control) return acc

      const category = control.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(control)
      return acc
    }, {})
  }, [data])

  const programs = useMemo(() => {
    return programsData?.programs?.edges?.map((edge) => edge?.node) || []
  }, [programsData])

  const toggleSelection = (controlId: string) => {
    setSelectedControls((prev) => (prev.includes(controlId) ? prev.filter((id) => id !== controlId) : [...prev, controlId]))
  }

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  return (
    <>
      <Accordion type="multiple" className="w-full">
        <div className="flex justify-between">
          <h2 className="text-2xl">Domains</h2>
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
        </div>
        {Object.entries(groupedControls).map(([category, controls]) => {
          const isOpen = openSections.includes(category)
          return (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold w-full p-4 cursor-pointer rounded-lg" onClick={() => toggleSection(category)}>
                <span>{category}</span>
                {isOpen ? <ChevronDown size={22} className="text-brand" /> : <ChevronRight size={22} className="text-brand" />}
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-card py-3 rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={selectedControls.length === controls.length} onCheckedChange={(checked: boolean) => setSelectedControls(checked ? controls.map((c) => c.id) : [])} />
                        </TableHead>
                        <TableHead className="whitespace-nowrap">Ref Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Subdomain</TableHead>
                        <TableHead className="whitespace-nowrap">Mapped Categories</TableHead>
                        <TableHead># of Sub controls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controls.map((control) => (
                        <TableRow key={control.id}>
                          <TableCell>
                            <Checkbox checked={selectedControls.includes(control.id)} onCheckedChange={() => toggleSelection(control.id)} />
                          </TableCell>
                          <TableCell className="text-blue-400 whitespace-nowrap">{control.refCode}</TableCell>
                          <TableCell>{control.description}</TableCell>
                          <TableCell>{control.subcategory}</TableCell>
                          <TableCell>{control.mappedCategories}</TableCell>
                          <TableCell>{control.subcontrols.totalCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {selectedControls.length > 0 && (
                    <div className="flex justify-between items-center mt-3 p-2 border-t">
                      <span>Add selected controls to an existing program</span>
                      <Button icon={<ShieldPlus />} iconPosition="left" onClick={() => setIsDialogOpen(true)}>
                        Add to a program ({selectedControls.length})
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[445px]">
          <DialogHeader>
            <DialogTitle>Add to a program</DialogTitle>
          </DialogHeader>
          <Select onValueChange={setSelectedProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program?.id} value={program?.id ?? ''}>
                  {program?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            {/* <Button onClick={() => console.log(selectedControls, selectedProgram)}>Add</Button> */}
            <Button>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StandardDetailsAccordion
