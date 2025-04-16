'use client'
import React, { useState, useMemo, useEffect } from 'react'
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
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'
import { useGetAllPrograms } from '@/lib/graphql-hooks/programs'
import { useCloneControls } from '@/lib/graphql-hooks/standards'
import { useNotification } from '@/hooks/useNotification'

const generateWhere = (id: string, searchValue: string) => ({
  and: [
    { standardID: id },
    {
      or: [{ refCodeContains: searchValue }, { categoryContains: searchValue }, { subcategoryContains: searchValue }, { descriptionContains: searchValue }],
    },
  ],
})

const StandardDetailsAccordion: FC = () => {
  const { successNotification, errorNotification } = useNotification()

  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [selectedControls, setSelectedControls] = useState<string[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const { mutateAsync: cloneControls, isPending } = useCloneControls()

  const where = generateWhere(id, debouncedSearchQuery)
  const { controls } = useGetAllControls({ where })
  const { data: programsData } = useGetAllPrograms()

  const groupedControls = useMemo(() => {
    if (!controls || controls.length === 0) return {}

    return controls.reduce<Record<string, ControlListFieldsFragment[]>>((acc, control) => {
      const category = control.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(control)
      return acc
    }, {})
  }, [controls])

  const programs = useMemo(() => {
    return programsData?.programs?.edges?.map((edge) => edge?.node) || []
  }, [programsData])

  const toggleSelection = (controlId: string) => {
    setSelectedControls((prev) => (prev.includes(controlId) ? prev.filter((id) => id !== controlId) : [...prev, controlId]))
  }

  const handleAddToProgram = async () => {
    if (!selectedProgram || selectedControls.length === 0) return

    try {
      await cloneControls({
        input: {
          programID: selectedProgram,
          controlIDs: selectedControls,
        },
      })

      successNotification({ title: 'Controls added to program successfully!' })
      setIsDialogOpen(false)
      setSelectedControls([])
    } catch (error) {
      errorNotification({ title: 'Failed to add controls to the program.' })
    }
  }

  useEffect(() => {
    const firstCategory = Object.keys(groupedControls)[0]
    if (firstCategory && openSections.length === 0) {
      setOpenSections([firstCategory])
    }
  }, [groupedControls])

  return (
    <>
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
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
              <AccordionTrigger className="flex items-center gap-2 text-lg font-semibold w-full p-4 cursor-pointer rounded-lg">
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
                          <TableCell>
                            {control?.description?.split('\n').map((line, i) => (
                              <React.Fragment key={i}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </TableCell>{' '}
                          <TableCell>{control.subcategory}</TableCell>
                          <TableCell>{control.mappedCategories?.join(', ')}</TableCell>
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
            <Button disabled={!selectedProgram || isPending} onClick={handleAddToProgram}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StandardDetailsAccordion
