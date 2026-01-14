'use client'

import React, { useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
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
import { Value } from 'platejs'
import { Info, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { TFormData, VersionBump } from './use-form-schema'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { ControlObjectiveStatusOptions } from '@/components/shared/enum-mapper/control-objective-enum'
import { SaveButton } from '@/components/shared/save-button/save-button'

const controlSourceLabels: Record<ControlObjectiveControlSource, string> = {
  [ControlObjectiveControlSource.FRAMEWORK]: 'Framework',
  [ControlObjectiveControlSource.IMPORTED]: 'Imported',
  [ControlObjectiveControlSource.TEMPLATE]: 'Template',
  [ControlObjectiveControlSource.USER_DEFINED]: 'User Defined',
}
export const CreateControlObjectiveForm = ({ onSuccess, defaultValues }: { onSuccess: () => void; defaultValues?: Partial<TFormData> }) => {
  const { id, subcontrolId } = useParams()
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues
  const isSubcontrol = !!subcontrolId
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(isSubcontrol ? null : (id as string))
  const { data: subcontrolData, isLoading } = useGetSubcontrolById((subcontrolId as string) || null)
  const loading = isLoadingControl || isLoading
  const [defaultValuesSet, setDefaultValuesSet] = useState(false)
  const { convertToHtml } = usePlateEditor()
  const { form } = useFormSchema()
  const {
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
    const desiredOutcome = await convertToHtml(data.desiredOutcome as Value)

    const basePayload = {
      ...data,
      desiredOutcome,
      subcontrolIDs: undefined,
      controlIDs: undefined,
    }

    const creationPayload = {
      ...basePayload,
      ...(subcontrolId ? { subcontrolIDs: [subcontrolId as string] } : { controlIDs: [id as string] }),
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

    const createDefValues: Partial<TFormData> = {
      status: ControlObjectiveObjectiveStatus.DRAFT,
      source: ControlObjectiveControlSource.USER_DEFINED,
      category: subcontrolData?.subcontrol?.category || controlData?.control?.category || '',
      subcategory: subcontrolData?.subcontrol?.subcategory || controlData?.control?.subcategory || '',
    }
    const defValues = isEditing ? defaultValues : createDefValues
    reset(defValues)
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
            <Button variant="secondary" className="h-8 px-4!">
              Create
            </Button>
            <Button variant="secondary" className="h-8 px-!4" type="button" onClick={onSuccess}>
              Cancel
            </Button>
          </>
        )}
      </div>
      <SheetHeader>{!isEditing && <SheetTitle className="text-left">Control Objective</SheetTitle>}</SheetHeader>
      {!isEditing && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Describe the goal this control is intended to achieve.</AlertTitle>
          <AlertDescription>
            <p>Focus on the risk it addresses, the outcome it supports, and how it contributes to your overall security or compliance posture.</p>
          </AlertDescription>
        </Alert>
      )}
      <div className="p-4 border rounded-lg">
        <div className="border-b flex items-center pb-2.5">
          <Label className="w-36 self-start">
            Name <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-col">
            <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
            {errors.name && <p className="text-red-500 mt-1 text-xs">{errors.name.message}</p>}
          </div>
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="self-start whitespace-nowrap min-w-36">Desired outcome</Label>
          <Controller control={control} name="desiredOutcome" render={({ field }) => <PlateEditor initialValue={defaultValues?.desiredOutcome} onChange={(val) => field.onChange(val)} />} />
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
                    {ControlObjectiveStatusOptions.map((option) => (
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
          <Label className="min-w-36">Source</Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ControlObjectiveControlSource).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {controlSourceLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Type</Label>
          <div>
            <Controller name="controlObjectiveType" control={control} render={({ field }) => <Input className="w-60" {...field} />} />
            <p className="text-xs mt-2">For example: compliance, financial, operational</p>
          </div>
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Category</Label>
          <Controller name="category" control={control} render={({ field }) => <Input className="w-60" {...field} />} />
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Subcategory</Label>
          <Controller name="subcategory" control={control} render={({ field }) => <Input className="w-60" {...field} />} />
        </div>

        {isEditing ? (
          <div className="border-b flex items-center py-2.5">
            <Label className="min-w-36">Revision</Label>
            <div className="flex flex-col">
              <Controller
                defaultValue={'DRAFT'}
                name="RevisionBump"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select revision type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VersionBump).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value.charAt(0) + value.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs mt-2">Current version: {defaultValues?.revision ?? 'v0.0.1'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center py-2.5">
            <Label className="min-w-36">Version</Label>
            <Input disabled value="v0.0.1" />
          </div>
        )}
      </div>
    </form>
  )
}
