'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useGetAllSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { Control, ControlWhereInput, Subcontrol, SubcontrolWhereInput } from '@repo/codegen/src/schema'
import { useDebounce } from '@uidotdev/usehooks'
import { LoaderCircle, SearchIcon } from 'lucide-react'

interface MapControlDialogProps {
  onSave: (selection: { controlIDs: string[]; subcontrolIDs: string[] }) => void
  mappedControls: { controlIDs: string[]; subcontrolIDs: string[] }
}

const MapControlDialog: React.FC<MapControlDialogProps> = ({ onSave, mappedControls }) => {
  const { convertToReadOnly } = usePlateEditor()
  const { currentOrgId } = useOrganization()

  const [enableSubcontrols, setEnableSubcontrols] = useState(false)
  const [referenceFramework, setReferenceFramework] = useState<string>('')
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 500)
  const searching = searchValue !== debouncedSearch

  const [mapping, setMapping] = useState<{ controlIDs: string[]; subcontrolIDs: string[] }>(mappedControls)

  const { where, subcontrolWhere, hasFilters } = useMemo(() => {
    const baseWhere: ControlWhereInput = {}

    if (referenceFramework && referenceFramework !== 'all') {
      if (referenceFramework === 'CUSTOM') {
        baseWhere.referenceFrameworkIsNil = true
      } else {
        baseWhere.referenceFramework = referenceFramework
      }
    }

    if (debouncedSearch) {
      baseWhere.or = [{ refCodeContainsFold: debouncedSearch }, { categoryContainsFold: debouncedSearch }, { subcategoryContainsFold: debouncedSearch }]
    }

    const filtersActive = !!(debouncedSearch || (referenceFramework && referenceFramework !== 'all'))

    return {
      where: baseWhere as ControlWhereInput,
      subcontrolWhere: baseWhere as SubcontrolWhereInput,
      hasFilters: filtersActive,
    }
  }, [debouncedSearch, referenceFramework])

  const { controls = [], isLoading: controlsLoading } = useGetAllControls({
    where: {
      ownerIDNEQ: '',
      ...where,
    },
    enabled: hasFilters,
  })

  const { subcontrols = [], isLoading: subcontrolsLoading } = useGetAllSubcontrols({
    where: {
      ownerIDNEQ: '',
      ...subcontrolWhere,
    },
    enabled: hasFilters && enableSubcontrols,
  })

  const isLoading = controlsLoading || subcontrolsLoading

  const { standardOptions = [] } = useStandardsSelect({
    where: {
      hasControlsWith: [{ hasOwnerWith: [{ id: currentOrgId }] }],
    },
    enabled: Boolean(currentOrgId),
  })

  const tableData = useMemo(() => {
    const combined = [...(controls || []), ...(enableSubcontrols ? subcontrols || [] : [])]
    return combined as (Control | Subcontrol)[]
  }, [controls, subcontrols, enableSubcontrols])

  const toggleRow = useCallback((row: Control | Subcontrol) => {
    const isControl = row.__typename === 'Control'
    const id = row.id

    setMapping((prev) => {
      if (isControl) {
        const exists = prev.controlIDs.includes(id)
        return {
          ...prev,
          controlIDs: exists ? prev.controlIDs.filter((i) => i !== id) : [...prev.controlIDs, id],
        }
      } else {
        const exists = prev.subcontrolIDs.includes(id)
        return {
          ...prev,
          subcontrolIDs: exists ? prev.subcontrolIDs.filter((i) => i !== id) : [...prev.subcontrolIDs, id],
        }
      }
    })
  }, [])

  const toggleAll = useCallback(() => {
    const allIdsOnPage = tableData.map((r) => r.id)
    const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every((id) => mapping.controlIDs.includes(id) || mapping.subcontrolIDs.includes(id))

    setMapping((prev) => {
      if (isAllSelected) {
        return {
          controlIDs: prev.controlIDs.filter((id) => !allIdsOnPage.includes(id)),
          subcontrolIDs: prev.subcontrolIDs.filter((id) => !allIdsOnPage.includes(id)),
        }
      } else {
        const newControls = [...prev.controlIDs]
        const newSubcontrols = [...prev.subcontrolIDs]

        tableData.forEach((row) => {
          if (row.__typename === 'Control' && !newControls.includes(row.id)) {
            newControls.push(row.id)
          } else if (row.__typename === 'Subcontrol' && !newSubcontrols.includes(row.id)) {
            newSubcontrols.push(row.id)
          }
        })

        return { controlIDs: newControls, subcontrolIDs: newSubcontrols }
      }
    })
  }, [tableData, mapping])

  const columns = useMemo<ColumnDef<Control | Subcontrol>[]>(
    () => [
      {
        id: 'select',
        header: () => <Checkbox checked={tableData.length > 0 && tableData.every((r) => mapping.controlIDs.includes(r.id) || mapping.subcontrolIDs.includes(r.id))} onCheckedChange={toggleAll} />,
        cell: ({ row }) => <Checkbox checked={mapping.controlIDs.includes(row.original.id) || mapping.subcontrolIDs.includes(row.original.id)} onCheckedChange={() => toggleRow(row.original)} />,
        size: 30,
      },
      {
        accessorKey: 'refCode',
        header: 'Ref Code',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.refCode}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{row.original.__typename}</span>
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const content = row.original.description || '-'
          return <div className="line-clamp-2 text-sm">{convertToReadOnly(content || '-')}</div>
        },
        size: 400,
      },
    ],
    [tableData, mapping, convertToReadOnly, toggleAll, toggleRow],
  )

  const handleSave = () => {
    onSave(mapping)
  }

  const totalSelected = mapping.controlIDs.length + mapping.subcontrolIDs.length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Map Control</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Map Controls</DialogTitle>
          <DialogDescription>Search and select controls from different frameworks to create an association.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select onValueChange={setReferenceFramework} value={referenceFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Framework" />
                </SelectTrigger>
                <SelectContent>
                  {standardOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM">CUSTOM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
                placeholder="Search ref code"
                value={searchValue}
                onChange={(event) => setSearchValue(event.currentTarget.value)}
                variant="searchTable"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Checkbox id="subcontrols" checked={enableSubcontrols} onCheckedChange={(val) => setEnableSubcontrols(!!val)} />
              <Label htmlFor="subcontrols" className="cursor-pointer text-sm font-medium">
                Enable Subcontrols
              </Label>
            </div>
            <Button variant="outline" onClick={() => setMapping({ controlIDs: [], subcontrolIDs: [] })}>
              Clear Mapping
            </Button>
          </div>

          <DataTable columns={columns} data={tableData} tableKey={undefined} loading={isLoading} wrapperClass="flex-1 border rounded-md overflow-auto min-h-[300px]" />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
          <DialogClose asChild>
            <Button variant="back">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave}>Save Mapping ({totalSelected})</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MapControlDialog
