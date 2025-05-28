'use client'

import React, { useEffect, useState } from 'react'
import { Controller, Form } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ControlObjectiveControlSource, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { useCreateControlObjective, useDeleteControlObjective, useUpdateControlObjective } from '@/lib/graphql-hooks/control-objectives'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'
import { Pencil, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { TFormData } from './use-form-schema'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SetObjectAssociationDialog } from '../set-object-association-dialog'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'

const controlSourceLabels: Record<ControlObjectiveControlSource, string> = {
  [ControlObjectiveControlSource.FRAMEWORK]: 'Framework',
  [ControlObjectiveControlSource.IMPORTED]: 'Imported',
  [ControlObjectiveControlSource.TEMPLATE]: 'Template',
  [ControlObjectiveControlSource.USER_DEFINED]: 'User Defined',
}
export const CreateControlImplementationForm = ({ onSuccess, defaultValues }: { onSuccess: () => void; defaultValues?: Partial<TFormData> }) => {
  const { id, subcontrolId } = useParams()
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues
  const isSubcontrol = !!subcontrolId
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(isSubcontrol ? null : (id as string))
  const { data: subcontrolData, isLoading } = useGetSubcontrolById((subcontrolId as string) || null)
  const loading = isLoadingControl || isLoading
  const [defaultValuesSet, setDefaultValuesSet] = useState(false)
  const initialAssociations: TObjectAssociationMap = subcontrolId ? { subcontrolIDs: [subcontrolId as string] } : { controlIDs: [id as string] }
  const [associations, setAssociations] = useState<TObjectAssociationMap>(initialAssociations)
  const { convertToHtml } = usePlateEditor()
  const { form } = useFormSchema()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form

  const { mutate: createObjective } = useCreateControlObjective()
  const { mutate: updateObjective } = useUpdateControlObjective()
  const { mutate: deleteObjective } = useDeleteControlObjective()

  const handleDelete = () => {
    if (defaultValues?.id) {
      deleteObjective(
        { deleteControlObjectiveId: defaultValues.id },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Objective deleted' })
            onSuccess()
          },
          onError: () => {
            errorNotification({ title: 'Delete failed', description: 'Could not delete objective. Please try again.' })
          },
        },
      )
    }
  }

  const onSubmit = async (data: TFormData) => {
    const creationPayload = {
      ...data,
      ...associations,
    }

    if (isEditing) {
      updateObjective(
        {
          updateControlObjectiveId: defaultValues.id || '',
          input: basePayload,
        },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Objective updated' })
            onSuccess()
          },
          onError: () => {
            errorNotification({ title: 'Update failed', description: 'Could not update objective. Please try again.' })
          },
        },
      )
    } else {
      createObjective(creationPayload, {
        onSuccess: () => {
          successNotification({ title: 'Control Objective created' })
          onSuccess()
        },
        onError: () => {
          errorNotification({ title: 'Create failed', description: 'Could not create objective. Please try again.' })
        },
      })
    }
  }

  useEffect(() => {
    if (loading && defaultValuesSet) {
      return
    }

    reset(defaultValues)
    setDefaultValuesSet(true)
  }, [defaultValues, reset, isEditing, controlData, subcontrolData, loading, defaultValuesSet])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button className="h-8 !px-4" icon={<Pencil />} iconPosition="left">
              Save edit
            </Button>
            <Button variant="back" className="h-8 !px-4" type="button" onClick={onSuccess}>
              Discard edit
            </Button>
            <Button variant="destructive" className="h-8 !px-4" icon={<Trash2 />} iconPosition="left" type="button" onClick={handleDelete}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button className="h-8 !px-4">Create</Button>
            <Button variant="back" className="h-8 !px-4" type="button" onClick={onSuccess}>
              Cancel
            </Button>
          </>
        )}
      </div>
      <SheetHeader>{!isEditing && <SheetTitle className="text-left">Create Implementation</SheetTitle>}</SheetHeader>
      <div className="p-4 border rounded-lg">
        <div className="border-b flex items-center py-2.5">
          <Label className="self-start whitespace-nowrap min-w-36">Desired outcome</Label>
          <Controller control={control} name="details" render={({ field }) => <PlateEditor initialValue={defaultValues?.details} onChange={(val) => field.onChange(val)} variant="basic" />} />
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => {
              return (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-60">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ControlObjectiveObjectiveStatus).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
        </div>
        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">
            Implementation <br /> date
          </Label>
          <div className="w-48">
            <Controller
              name="implementationDate"
              control={form.control}
              render={({ field }) => (
                <>
                  <CalendarPopover field={field} disabledFrom={new Date()} />
                </>
              )}
            />
          </div>
        </div>

        <div className="flex items-center py-2.5">
          <Label className="min-w-36">ControlIDs</Label>
          <SetObjectAssociationDialog initialData={initialAssociations} associations={associations} setAssociations={setAssociations} />
        </div>
      </div>
    </form>
  )
}
