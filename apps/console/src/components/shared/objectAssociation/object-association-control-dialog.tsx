'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useGetAllSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { ControlListFieldsFragment, ControlOrderField, GetAllControlsQueryVariables, OrderDirection, Subcontrol } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'

type ControlSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialControlData?: TObjectAssociationMap
  initialControlRefCodes?: string[]
  initialSubcontrolRefCodes?: string[]
  initialFramework?: Record<string, string>
  initialSubcontrolFramework?: Record<string, string>
  onSave: (
    idsMap: TObjectAssociationMap,
    subcontrolsIdsMap: TObjectAssociationMap,
    refCodesMap: string[],
    subcontrolsRefCodesMap: string[],
    frameworks: Record<string, string>,
    subcontrolFrameworks: Record<string, string>,
  ) => void
}

export const ControlSelectionDialog: React.FC<ControlSelectionDialogProps> = ({
  open,
  onClose,
  initialControlData,
  initialControlRefCodes,
  initialSubcontrolRefCodes,
  initialFramework = {},
  initialSubcontrolFramework = {},
  onSave,
}) => {
  const [selectedObject, setSelectedObject] = useState<'Control' | 'Subcontrol'>('Control')

  // Controls
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({ controlIDs: [] })
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<string[]>([])
  const [frameworks, setFrameworks] = useState<Record<string, string>>({})

  // Subcontrols
  const [selectedSubcontrolIdsMap, setSelectedSubcontrolIdsMap] = useState<TObjectAssociationMap>({ subcontrolIDs: [] })
  const [selectedSubcontrolRefCodeMap, setSelectedSubcontrolRefCodeMap] = useState<string[]>([])
  const [subcontrolFrameworks, setSubcontrolFrameworks] = useState<Record<string, string>>({})

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const { convertToReadOnly } = usePlateEditor()

  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    page: 1,
    pageSize: 5,
    query: { first: 5 },
  })

  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>([{ field: ControlOrderField.ref_code, direction: OrderDirection.ASC }])

  useEffect(() => {
    if (!open) return

    setSelectedIdsMap({ controlIDs: initialControlData?.controlIDs ?? [] })
    setSelectedRefCodeMap(initialControlRefCodes ?? [])
    setFrameworks(initialFramework ?? {})

    setSelectedSubcontrolIdsMap({ subcontrolIDs: initialControlData?.subcontrolIDs ?? [] })
    setSelectedSubcontrolRefCodeMap(initialSubcontrolRefCodes ?? [])
    setSubcontrolFrameworks(initialSubcontrolFramework ?? {})
  }, [open, initialControlData, initialControlRefCodes, initialSubcontrolRefCodes, initialFramework, initialSubcontrolFramework])

  const {
    controls,
    paginationMeta: controlsPagination,
    isLoading: controlsLoading,
    isFetching: controlsFetching,
  } = useGetAllControls({
    where: { ownerIDNEQ: '', refCodeContainsFold: debouncedSearch },
    orderBy,
    pagination,
  })

  const {
    subcontrol: subcontrols,
    paginationMeta: subcontrolsPagination,
    isLoading: subcontrolsLoading,
    isFetching: subcontrolsFetching,
  } = useGetAllSubcontrols({
    where: { refCodeContainsFold: debouncedSearch },
    pagination,
  })

  const items: (ControlListFieldsFragment | Subcontrol)[] = selectedObject === 'Control' ? controls ?? [] : subcontrols ?? []

  const paginationMeta = selectedObject === 'Control' ? controlsPagination : subcontrolsPagination
  const isLoading = selectedObject === 'Control' ? controlsLoading : subcontrolsLoading
  const isFetching = selectedObject === 'Control' ? controlsFetching : subcontrolsFetching

  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    if (selectedObject === 'Control') {
      const newIds = isChecked ? [...new Set([...(selectedIdsMap.controlIDs || []), id])] : selectedIdsMap.controlIDs?.filter((v) => v !== id)

      const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap || []), refCode])] : selectedRefCodeMap?.filter((v) => v !== refCode)

      const newFrameworks = isChecked ? { ...frameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(frameworks).filter(([key]) => key !== id))

      setSelectedIdsMap({ controlIDs: newIds })
      setSelectedRefCodeMap(newRefCodes)
      setFrameworks(newFrameworks)
    } else {
      const newIds = isChecked ? [...new Set([...(selectedSubcontrolIdsMap.subcontrolIDs || []), id])] : selectedSubcontrolIdsMap.subcontrolIDs?.filter((v) => v !== id)

      const newRefCodes = isChecked ? [...new Set([...(selectedSubcontrolRefCodeMap || []), refCode])] : selectedSubcontrolRefCodeMap?.filter((v) => v !== refCode)

      const newFrameworks = isChecked ? { ...subcontrolFrameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(subcontrolFrameworks).filter(([key]) => key !== id))

      setSelectedSubcontrolIdsMap({ subcontrolIDs: newIds })
      setSelectedSubcontrolRefCodeMap(newRefCodes)
      setSubcontrolFrameworks(newFrameworks)
    }
  }

  const columns: ColumnDef<ControlListFieldsFragment | Subcontrol>[] = [
    {
      accessorKey: 'name',
      header: selectedObject === 'Control' ? 'Control' : 'Subcontrol',
      cell: ({ row }) => {
        const { id, refCode, referenceFramework } = row.original
        const checked = selectedObject === 'Control' ? selectedIdsMap.controlIDs?.includes(id) ?? false : selectedSubcontrolIdsMap.subcontrolIDs?.includes(id) ?? false

        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, refCode, val === true, referenceFramework || undefined)} />
            <span>{refCode}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="line-clamp-3 text-justify">{convertToReadOnly(row.getValue('description') as string, 0)}</div>,
    },
  ]

  const handleSave = () => {
    onSave(selectedIdsMap, selectedSubcontrolIdsMap, selectedRefCodeMap, selectedSubcontrolRefCodeMap, frameworks, subcontrolFrameworks)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Controls</DialogTitle>
        </DialogHeader>

        <Select value={selectedObject} onValueChange={(val: string) => setSelectedObject(val as 'Control' | 'Subcontrol')}>
          <SelectTrigger className="w-full">{selectedObject}</SelectTrigger>
          <SelectContent>
            {(['Control', 'Subcontrol'] as const)
              .filter((option) => option !== selectedObject)
              .map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Input placeholder="Search controls" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-2" />

        <DataTable
          columns={columns}
          data={items || []}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={paginationMeta}
          onSortChange={setOrderBy}
          loading={isLoading || isFetching}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
