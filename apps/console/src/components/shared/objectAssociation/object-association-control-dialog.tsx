'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { ControlListFieldsFragment, ControlOrderField, GetAllControlsQueryVariables, OrderDirection } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'

type ControlSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialControlData?: TObjectAssociationMap
  initialControlRefCodes?: string[]
  initialFramework: Record<string, string>
  onSave: (idsMap: TObjectAssociationMap, refCodesMap: string[], frameworks: Record<string, string>) => void
}

export const ControlSelectionDialog: React.FC<ControlSelectionDialogProps> = ({ open, onClose, initialControlData, initialControlRefCodes, initialFramework, onSave }: ControlSelectionDialogProps) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({ controlIDs: [] })
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<string[]>([])
  const [frameworks, setFrameworks] = useState<Record<string, string>>({})
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
    if (open) {
      setSelectedIdsMap(initialControlData?.controlIDs ? { controlIDs: [...initialControlData.controlIDs] } : { controlIDs: [] })
      setSelectedRefCodeMap(initialControlRefCodes ? [...initialControlRefCodes] : [])
      setFrameworks(initialFramework ? { ...initialFramework } : {})
    }
  }, [open, initialControlData, initialControlRefCodes, initialFramework])

  const { controls, paginationMeta, isLoading, isFetching } = useGetAllControls({
    where: { ownerIDNEQ: '', refCodeContainsFold: debouncedSearch },
    orderBy,
    pagination,
  })

  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    const newIds = isChecked ? [...new Set([...(selectedIdsMap.controlIDs || []), id])] : selectedIdsMap.controlIDs?.filter((v) => v !== id)

    const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap || []), refCode])] : selectedRefCodeMap?.filter((v) => v !== refCode)

    const newFrameworks = isChecked ? { ...frameworks, [id]: referenceFramework ?? '' } : Object.fromEntries(Object.entries(frameworks).filter(([key]) => key !== id))

    setSelectedIdsMap({ controlIDs: newIds })
    setSelectedRefCodeMap(newRefCodes)
    setFrameworks(newFrameworks)
  }

  const columns: ColumnDef<ControlListFieldsFragment>[] = [
    {
      accessorKey: 'name',
      header: 'Control',
      cell: ({ row }) => {
        const { id, refCode, referenceFramework } = row.original
        const checked = selectedIdsMap.controlIDs?.includes(id) ?? false

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
    onSave(selectedIdsMap, selectedRefCodeMap, frameworks)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Controls</DialogTitle>
        </DialogHeader>

        <Input placeholder="Search controls" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-2" />

        <DataTable
          columns={columns}
          data={controls}
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
