'use client'

import React, { useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'
import { Info, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { TFormData } from './use-form-schema'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SetObjectAssociationDialog } from '../set-object-association-dialog'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useCreateControlImplementation, useDeleteControlImplementation, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementations'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { ControlImplementationStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { SaveButton } from '@/components/shared/save-button/save-button'

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
  const { handleSubmit, control, reset } = form
  const { mutate: createImplementation } = useCreateControlImplementation()
  const { mutate: updateImplementation } = useUpdateControlImplementation()
  const { mutate: deleteImplementation } = useDeleteControlImplementation()

  const handleDelete = () => {
    if (defaultValues?.id) {
      deleteImplementation(
        { deleteControlImplementationId: defaultValues.id },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Implementation deleted' })
            onSuccess()
          },
          onError: () => {
            errorNotification({
              title: 'Delete failed',
              description: 'Could not delete control implementation. Please try again.',
            })
          },
        },
      )
    }
  }

  const onSubmit = async (data: TFormData) => {
    const details = data.details ? await convertToHtml(data.details as Value) : undefined

    const basePayload = {
      ...data,
      details,
    }

    const creationPayload = {
      ...basePayload,
      ...associations,
    }

    if (isEditing) {
      updateImplementation(
        {
          updateControlImplementationId: defaultValues.id || '',
          input: basePayload,
        },
        {
          onSuccess: () => {
            successNotification({ title: 'Control Implementation updated' })
            onSuccess()
          },
          onError: () => {
            errorNotification({
              title: 'Update failed',
              description: 'Could not update control implementation. Please try again.',
            })
          },
        },
      )
    } else {
      createImplementation(creationPayload, {
        onSuccess: () => {
          successNotification({ title: 'Control Implementation created' })
          onSuccess()
        },
        onError: () => {
          errorNotification({
            title: 'Create failed',
            description: 'Could not create control implementation. Please try again.',
          })
        },
      })
    }
  }

  useEffect(() => {
    if (loading && defaultValuesSet) {
      return
    }

    const defaultValuesCreate = { implementationDate: new Date() }

    reset(isEditing ? defaultValues : defaultValuesCreate)
    setDefaultValuesSet(true)
  }, [defaultValues, reset, isEditing, controlData, subcontrolData, loading, defaultValuesSet])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <SaveButton />
            <Button variant="back" className="h-8 px-4!" type="button" onClick={onSuccess}>
              Cancel
            </Button>
            <Button variant="destructive" className="h-8 px-4!" icon={<Trash2 />} iconPosition="left" type="button" onClick={handleDelete}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button className="h-8 px-4!">Create</Button>
            <Button variant="back" className="h-8 px-4!" type="button" onClick={onSuccess}>
              Cancel
            </Button>
          </>
        )}
      </div>
      <SheetHeader>{!isEditing && <SheetTitle className="text-left">Control Implementation</SheetTitle>}</SheetHeader>
      {!isEditing && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Add details about how this control is implemented in your environment.</AlertTitle>
          <AlertDescription>
            <p>Include relevant tools, processes, teams involved, and how effectiveness is ensured.</p>
          </AlertDescription>
        </Alert>
      )}
      <div className="p-4 border rounded-lg">
        <div className="border-b flex items-center py-2.5">
          <Label className="self-start whitespace-nowrap min-w-36">Details</Label>
          <Controller control={control} name="details" render={({ field }) => <PlateEditor initialValue={defaultValues?.details} onChange={(val) => field.onChange(val)} />} />
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
                    {ControlImplementationStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
        </div>
        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Date Implemented</Label>
          <div className="w-48">
            <Controller name="implementationDate" control={form.control} render={({ field }) => <CalendarPopover field={field} disabledFrom={new Date()} defaultToday />} />
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center py-2.5">
            <Label className="min-w-36">Controls</Label>
            <SetObjectAssociationDialog initialData={associations} setAssociations={setAssociations} />
          </div>
        )}
      </div>
    </form>
  )
}
