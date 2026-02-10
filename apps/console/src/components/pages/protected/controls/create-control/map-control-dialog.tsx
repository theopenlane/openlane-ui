'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { ColumnDef } from '@tanstack/react-table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useGetAllSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { Control, ControlWhereInput, Subcontrol, SubcontrolWhereInput } from '@repo/codegen/src/schema'
import { useDebounce } from '@uidotdev/usehooks'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface MapControlDialogProps {
  onSave: (arg: { controls: Control[]; subcontrols: Subcontrol[] }) => void
  mappedControls: { controls: Control[]; subcontrols: Subcontrol[] }
}

const MapControlDialog: React.FC<MapControlDialogProps> = ({ onSave, mappedControls }) => {
  const { convertToReadOnly } = usePlateEditor()
  const { currentOrgId } = useOrganization()

  const [mode, setMode] = useState<'controls' | 'subcontrols'>('controls')
  const [referenceFramework, setReferenceFramework] = useState<string>('')
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 500)
  const searching = searchValue !== debouncedSearch
  const [mapping, setMapping] = useState<{ controls: Control[]; subcontrols: Subcontrol[] }>(mappedControls)

  const defaultPagination = { ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } }
  const [pagination, setPagination] = useState<TPagination>(defaultPagination)

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

    return {
      where: baseWhere as ControlWhereInput,
      subcontrolWhere: baseWhere as SubcontrolWhereInput,
      hasFilters: !!(debouncedSearch || (referenceFramework && referenceFramework !== 'all')),
    }
  }, [debouncedSearch, referenceFramework])

  const {
    controls = [],
    isLoading: controlsLoading,
    paginationMeta: controlsPaginationMeta,
  } = useGetAllControls({
    where: {
      ownerIDNEQ: '',
      ...where,
    },
    enabled: hasFilters && mode === 'controls',
    pagination,
  })

  const {
    subcontrols = [],
    isLoading: subcontrolsLoading,
    paginationMeta: subcontrolsPaginationMeta,
  } = useGetAllSubcontrols({
    where: {
      ownerIDNEQ: '',
      ...subcontrolWhere,
    },
    pagination,
    enabled: hasFilters && mode === 'subcontrols',
  })

  const isLoading = controlsLoading || subcontrolsLoading

  const { standardOptions = [] } = useStandardsSelect({
    where: {
      hasControlsWith: [{ hasOwnerWith: [{ id: currentOrgId }] }],
    },
    enabled: Boolean(currentOrgId),
  })

  const tableData = useMemo(() => {
    if (mode === 'controls') return controls as Control[]
    return subcontrols as Subcontrol[]
  }, [controls, subcontrols, mode])

  const isSelected = useCallback(
    (id: string) => {
      return mapping.controls.some((c) => c.id === id) || mapping.subcontrols.some((s) => s.id === id)
    },
    [mapping],
  )

  const toggleRow = useCallback((row: Control | Subcontrol) => {
    const isControl = row.__typename === ObjectTypes.CONTROL
    const id = row.id

    setMapping((prev) => {
      if (isControl) {
        const exists = prev.controls.some((c) => c.id === id)
        return {
          ...prev,
          controls: exists ? prev.controls.filter((c) => c.id !== id) : [...prev.controls, row as Control],
        }
      } else {
        const exists = prev.subcontrols.some((s) => s.id === id)
        return {
          ...prev,
          subcontrols: exists ? prev.subcontrols.filter((s) => s.id !== id) : [...prev.subcontrols, row as Subcontrol],
        }
      }
    })
  }, [])

  const toggleAll = useCallback(() => {
    const allIdsOnPage = tableData.map((r) => r.id)
    const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every((id) => isSelected(id))

    setMapping((prev) => {
      if (isAllSelected) {
        return {
          controls: prev.controls.filter((c) => !allIdsOnPage.includes(c.id)),
          subcontrols: prev.subcontrols.filter((s) => !allIdsOnPage.includes(s.id)),
        }
      } else {
        const newControls = [...prev.controls]
        const newSubcontrols = [...prev.subcontrols]

        tableData.forEach((row) => {
          if (!isSelected(row.id)) {
            if (row.__typename === ObjectTypes.CONTROL) {
              newControls.push(row as Control)
            } else {
              newSubcontrols.push(row as Subcontrol)
            }
          }
        })

        return { controls: newControls, subcontrols: newSubcontrols }
      }
    })
  }, [tableData, isSelected])

  useEffect(() => {
    setMapping(mappedControls)
  }, [mappedControls])

  const columns = useMemo<ColumnDef<Control | Subcontrol>[]>(
    () => [
      {
        id: 'select',
        header: () => <Checkbox checked={tableData.length > 0 && tableData.every((r) => isSelected(r.id))} onCheckedChange={toggleAll} />,
        cell: ({ row }) => <Checkbox checked={isSelected(row.original.id)} onCheckedChange={() => toggleRow(row.original)} />,
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
          return <div className="line-clamp-2 text-sm">{convertToReadOnly(content)}</div>
        },
        size: 400,
      },
    ],
    [tableData, isSelected, convertToReadOnly, toggleAll, toggleRow],
  )

  const handleSave = () => {
    onSave({
      controls: mapping.controls,
      subcontrols: mapping.subcontrols,
    })
  }

  const totalSelected = mapping.controls.length + mapping.subcontrols.length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Map Control</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Map Controls</DialogTitle>
          <DialogDescription>Search and select controls from different frameworks to create an association.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 flex flex-col">
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
            <RadioGroup
              defaultValue="controls"
              value={mode}
              onValueChange={(val) => {
                setMode(val as 'controls' | 'subcontrols')
                setPagination(defaultPagination)
              }}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="controls" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer font-medium">
                  Controls
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subcontrols" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer font-medium">
                  Subcontrols
                </Label>
              </div>
            </RadioGroup>

            <Button variant="outline" onClick={() => setMapping({ controls: [], subcontrols: [] })}>
              Clear Mapping
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={tableData}
            tableKey={undefined}
            loading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={mode === 'controls' ? controlsPaginationMeta : subcontrolsPaginationMeta}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
          <DialogClose asChild>
            <CancelButton />
          </DialogClose>
          <DialogClose asChild>
            <SaveButton onClick={handleSave} title={`Save Mapping (${totalSelected})`} />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MapControlDialog
