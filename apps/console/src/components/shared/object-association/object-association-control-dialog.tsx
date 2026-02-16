'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { useGetAllControls } from '@/lib/graphql-hooks/control'
import { useGetAllSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { ControlListFieldsFragment, ControlOrderField, GetAllControlsQueryVariables, OrderDirection, Subcontrol } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { getControlsAndSubcontrolsColumns } from './object-association-controls-columns'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SaveButton } from '../save-button/save-button'
import { CancelButton } from '../cancel-button.tsx/cancel-button'

export enum AccordionEnum {
  Control = 'Control',
  Subcontrol = 'Subcontrol',
}

type TControlSelectionDialogProps = {
  open: boolean
  onClose: () => void
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  form: UseFormReturn<CreateEvidenceFormData>
}

export const ControlSelectionDialog: React.FC<TControlSelectionDialogProps> = ({ open, onClose, form, evidenceControls, setEvidenceControls, evidenceSubcontrols, setEvidenceSubcontrols }) => {
  const [selectedObject, setSelectedObject] = useState<AccordionEnum>(AccordionEnum.Control)

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const { convertToReadOnly } = usePlateEditor()

  const [initialEvidenceControls, setInitialEvidenceControls] = useState<CustomEvidenceControl[] | null>(null)
  const [initialEvidenceSubcontrols, setInitialEvidenceSubcontrols] = useState<CustomEvidenceControl[] | null>(null)
  const [initialControlIDs, setInitialControlIDs] = useState<string[]>([])
  const [initialSubcontrolIDs, setInitialSubcontrolIDs] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setInitialEvidenceControls(evidenceControls ?? [])
      setInitialEvidenceSubcontrols(evidenceSubcontrols ?? [])
      setInitialControlIDs(form.getValues('controlIDs') ?? [])
      setInitialSubcontrolIDs(form.getValues('subcontrolIDs') ?? [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.OBJECT_ASSOCIATION_CONTROLS, {
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    }),
  )

  const defaultSorting = getInitialSortConditions(TableKeyEnum.OBJECT_ASSOCIATION_CONTROLS, ControlOrderField, [{ field: ControlOrderField.ref_code, direction: OrderDirection.ASC }])
  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>(defaultSorting)

  useEffect(() => {
    setPagination({
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    })
  }, [selectedObject])

  const controlsWhere = useMemo(() => {
    const baseWhere = { ownerIDNEQ: '' }

    if (!debouncedSearch) return baseWhere

    return {
      ...baseWhere,
      and: [
        {
          or: [{ refCodeContainsFold: debouncedSearch }, { descriptionContainsFold: debouncedSearch }],
        },
      ],
    }
  }, [debouncedSearch])

  const subcontrolsWhere = useMemo(() => {
    const baseWhere = { ownerIDNEQ: '' }

    if (!debouncedSearch) return baseWhere

    return {
      ...baseWhere,
      and: [
        {
          or: [{ refCodeContainsFold: debouncedSearch }, { descriptionContainsFold: debouncedSearch }],
        },
      ],
    }
  }, [debouncedSearch])

  const {
    controls,
    paginationMeta: controlsPagination,
    isLoading: controlsLoading,
    isFetching: controlsFetching,
  } = useGetAllControls({
    where: controlsWhere,
    orderBy,
    pagination,
  })

  const {
    subcontrols,
    paginationMeta: subcontrolsPagination,
    isLoading: subcontrolsLoading,
    isFetching: subcontrolsFetching,
  } = useGetAllSubcontrols({
    where: subcontrolsWhere,
    pagination,
  })

  const items: (ControlListFieldsFragment | Subcontrol)[] = selectedObject === AccordionEnum.Control ? controls ?? [] : subcontrols ?? []

  const paginationMeta = selectedObject === AccordionEnum.Control ? controlsPagination : subcontrolsPagination
  const isLoading = selectedObject === AccordionEnum.Control ? controlsLoading : subcontrolsLoading
  const isFetching = selectedObject === AccordionEnum.Control ? controlsFetching : subcontrolsFetching

  const columns = useMemo(
    () =>
      getControlsAndSubcontrolsColumns({
        selectedObject,
        convertToReadOnly: convertToReadOnly!,
        form,
        evidenceControls,
        setEvidenceControls,
        evidenceSubcontrols,
        setEvidenceSubcontrols,
      }),
    [selectedObject, convertToReadOnly, form, evidenceControls, setEvidenceControls, evidenceSubcontrols, setEvidenceSubcontrols],
  )

  const handleSave = () => {
    onClose()
  }

  const handleCancel = () => {
    setEvidenceControls(initialEvidenceControls ? [...initialEvidenceControls] : null)
    setEvidenceSubcontrols(initialEvidenceSubcontrols ? [...initialEvidenceSubcontrols] : null)

    form.setValue('controlIDs', [...initialControlIDs], { shouldValidate: false, shouldDirty: false })
    form.setValue('subcontrolIDs', [...initialSubcontrolIDs], { shouldValidate: false, shouldDirty: false })

    onClose()
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Controls</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 items-center">
          <Select
            value={selectedObject}
            onValueChange={(val: string) => {
              setSelectedObject(val as AccordionEnum.Control | AccordionEnum.Subcontrol)
              setPagination((prev) => ({
                ...prev,
                page: 1,
                query: { first: prev.pageSize },
              }))
            }}
          >
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

          <Input placeholder="Search controls" value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>

        <DataTable
          columns={columns}
          data={items || []}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={paginationMeta}
          onSortChange={setOrderBy}
          loading={isLoading || isFetching}
          defaultSorting={defaultSorting}
          tableKey={TableKeyEnum.OBJECT_ASSOCIATION_CONTROLS}
        />

        <DialogFooter>
          <CancelButton onClick={handleCancel}></CancelButton>
          <SaveButton onClick={handleSave} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
