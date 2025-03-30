'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TFormDataResponse } from '@/components/pages/protected/evidence/object-association/types/TFormDataResponse'
import { TEvidenceObjectTypes } from '@/components/pages/protected/evidence/object-association/types/TEvidenceObjectTypes.ts'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'

type TProps = {
  data: TFormDataResponse[]
  onEvidenceObjectIdsChange: (evidenceObjectIds: TEvidenceObjectTypes[]) => void
  form?: UseFormReturn<CreateEvidenceFormData>
}

const EvidenceObjectAssociationTable: React.FC<TProps> = (props: TProps) => {
  const [evidenceObjectIds, setEvidenceObjectIds] = useState<TEvidenceObjectTypes[]>([])

  useEffect(() => {
    props.onEvidenceObjectIdsChange(evidenceObjectIds)
  }, [evidenceObjectIds])

  useEffect(() => {
    if (props?.form) {
      setEvidenceObjectIds([
        ...(props.form.getValues('controlObjectiveIDs')?.length ? [{ inputName: 'controlObjectiveIDs', objectIds: props.form.getValues('controlObjectiveIDs') || [] }] : []),
        ...(props.form.getValues('subcontrolIDs')?.length ? [{ inputName: 'subcontrolIDs', objectIds: props.form.getValues('subcontrolIDs') || [] }] : []),
        ...(props.form.getValues('programIDs')?.length ? [{ inputName: 'programIDs', objectIds: props.form.getValues('programIDs') || [] }] : []),
        ...(props.form.getValues('controlIDs')?.length ? [{ inputName: 'controlIDs', objectIds: props.form.getValues('controlIDs') || [] }] : []),
        ...(props.form.getValues('taskIDs')?.length ? [{ inputName: 'taskIDs', objectIds: props.form.getValues('taskIDs') || [] }] : []),
      ])
    }
  }, [props?.form])

  const columns: ColumnDef<TObjectAssociationColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const objectAssociationId = row.original.id as string
        const name = row.original.name
        const inputName = row.original.inputName
        const isChecked = evidenceObjectIds.some((item) => item.objectIds.includes(objectAssociationId))

        return (
          <div className="flex items-center gap-3">
            <Checkbox
              id={objectAssociationId}
              checked={isChecked}
              onCheckedChange={(checked) => {
                setEvidenceObjectIds((prevState) => {
                  const existingIndex = prevState.findIndex((item) => item.inputName === inputName)

                  if (checked) {
                    if (existingIndex !== -1) {
                      return prevState.map((item, idx) => (idx === existingIndex ? { ...item, objectIds: [...item.objectIds, objectAssociationId] } : item))
                    }
                    return [...prevState, { inputName: inputName, objectIds: [objectAssociationId] }]
                  } else {
                    return prevState
                      .map((item) => (item.inputName === inputName ? { ...item, objectIds: item.objectIds.filter((id) => id !== objectAssociationId) } : item))
                      .filter((item) => item.objectIds.length > 0)
                  }
                })
              }}
            />
            <span>{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
  ]

  return <DataTable columns={columns} data={props.data} />
}

export default EvidenceObjectAssociationTable
