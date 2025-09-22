'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { DataTable } from '@repo/ui/data-table'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { useGetAllSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { ControlListFieldsFragment, ControlOrderField, GetAllControlsQueryVariables, OrderDirection, Subcontrol } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { getControlsAndSubcontrolsColumns } from './object-association-controls-columns'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

type ControlSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialControlRefCodes?: string[]
  initialSubcontrolRefCodes?: string[]
  initialFramework?: Record<string, string>
  initialSubcontrolFramework?: Record<string, string>
  onSave: (
    newIds: string[],
    subcontrolsNewIds: string[],
    refCodesMap: string[],
    subcontrolsRefCodesMap: string[],
    frameworks: Record<string, string>,
    subcontrolFrameworks: Record<string, string>,
  ) => void
  form: UseFormReturn<CreateEvidenceFormData>
}

export const ControlSelectionDialog: React.FC<ControlSelectionDialogProps> = ({
  open,
  onClose,
  // initialControlData,
  initialControlRefCodes,
  initialSubcontrolRefCodes,
  initialFramework = {},
  initialSubcontrolFramework = {},
  onSave,
  form,
}) => {
  const [selectedObject, setSelectedObject] = useState<'Control' | 'Subcontrol'>('Control')

  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<string[]>([])
  const [frameworks, setFrameworks] = useState<Record<string, string>>({})

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

    setSelectedRefCodeMap(initialControlRefCodes ?? [])
    setFrameworks(initialFramework ?? {})

    setSelectedSubcontrolRefCodeMap(initialSubcontrolRefCodes ?? [])
    setSubcontrolFrameworks(initialSubcontrolFramework ?? {})
  }, [open, initialControlRefCodes, initialSubcontrolRefCodes, initialFramework, initialSubcontrolFramework])

  useEffect(() => {
    setPagination({
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    })
  }, [selectedObject])

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

  const columns = useMemo(
    () =>
      getControlsAndSubcontrolsColumns({
        selectedObject,
        // selectedIdsMap,
        selectedRefCodeMap,
        frameworks,
        // selectedSubcontrolIdsMap,
        selectedSubcontrolRefCodeMap,
        subcontrolFrameworks,
        // setSelectedIdsMap,
        setSelectedRefCodeMap,
        setFrameworks,
        // setSelectedSubcontrolIdsMap,
        setSelectedSubcontrolRefCodeMap,
        setSubcontrolFrameworks,
        convertToReadOnly: convertToReadOnly!,
        form,
      }),
    [selectedObject, selectedRefCodeMap, frameworks, selectedSubcontrolRefCodeMap, subcontrolFrameworks, convertToReadOnly, form],
  )

  const handleSave = () => {
    onSave(form.getValues('controlIDs') || [], form.getValues('subcontrolIDs') || [], selectedRefCodeMap, selectedSubcontrolRefCodeMap, frameworks, subcontrolFrameworks)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Controls</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 items-center">
          <Select value={selectedObject} onValueChange={(val: string) => setSelectedObject(val as 'Control' | 'Subcontrol')}>
            <SelectTrigger>{selectedObject}</SelectTrigger>
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

          <Input placeholder="Search controls" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

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
