'use client'

import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  desiredOutcome: z.any().optional(),
  status: z.nativeEnum(ControlObjectiveObjectiveStatus),
  source: z.nativeEnum(ControlObjectiveControlSource),
  controlObjectiveType: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  controlIDs: z.array(z.string()).optional(),
  subcontrolIDs: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof schema> & { id?: string }

const controlSourceLabels: Record<ControlObjectiveControlSource, string> = {
  [ControlObjectiveControlSource.FRAMEWORK]: 'Framework',
  [ControlObjectiveControlSource.IMPORTED]: 'Imported',
  [ControlObjectiveControlSource.TEMPLATE]: 'Template',
  [ControlObjectiveControlSource.USER_DEFINED]: 'User Defined',
}
export const CreateControlObjectiveForm = ({ onSuccess, defaultValues }: { onSuccess: () => void; defaultValues?: Partial<FormData> }) => {
  const { id, subcontrolId } = useParams()
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { convertToHtml } = usePlateEditor()

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

  const onSubmit = async (data: FormData) => {
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
    if (defaultValues) {
      reset(defaultValues)
    }
  }, [defaultValues, reset])

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
      <SheetHeader>
        <SheetTitle className="text-left">Create Objective</SheetTitle>
      </SheetHeader>
      <div className="p-4 border rounded-lg">
        <div className="border-b flex items-center pb-2.5">
          <Label className="w-36">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="self-start whitespace-nowrap min-w-36">Desired outcome</Label>
          <Controller
            control={control}
            name="desiredOutcome"
            render={({ field }) => <PlateEditor initialValue={defaultValues?.desiredOutcome} onChange={(val) => field.onChange(val)} variant="basic" />}
          />
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Status</Label>
          <Controller
            name="status"
            control={control}
            defaultValue={ControlObjectiveObjectiveStatus.DRAFT}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ControlObjectiveObjectiveStatus).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Source</Label>
          <Controller
            name="source"
            control={control}
            defaultValue={ControlObjectiveControlSource.USER_DEFINED}
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
            <Input className="w-60" {...register('controlObjectiveType')} />
            <p className="text-xs mt-2">For example: compliance, financial, operational</p>
          </div>
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Category</Label>
          <Input className="w-60" {...register('category')} />
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Subcategory</Label>
          <Input className="w-60" {...register('subcategory')} />
        </div>

        <div className="flex items-center py-2.5">
          <Label className="min-w-36">Version</Label>
          <Input disabled value="v0.0.1" />
        </div>
      </div>
    </form>
  )
}
