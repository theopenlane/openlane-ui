'use client'

import React from 'react'
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
import { useCreateControlObjective } from '@/lib/graphql-hooks/control-objectives'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  desiredOutcome: z.string().optional(),
  status: z.nativeEnum(ControlObjectiveObjectiveStatus),
  source: z.nativeEnum(ControlObjectiveControlSource),
  type: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const controlSourceLabels: Record<ControlObjectiveControlSource, string> = {
  [ControlObjectiveControlSource.FRAMEWORK]: 'Framework',
  [ControlObjectiveControlSource.IMPORTED]: 'Imported',
  [ControlObjectiveControlSource.TEMPLATE]: 'Template',
  [ControlObjectiveControlSource.USER_DEFINED]: 'User Defined',
}
export const CreateControlObjectiveForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate } = useCreateControlObjective()

  const onSubmit = (data: FormData) => {
    console.log(data)
    mutate(data, {
      onSuccess: () => {
        onSuccess()
      },
      onError: (err) => {
        console.error('Create failed:', err)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onSuccess}>
          Cancel
        </Button>
        <Button>Create</Button>
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
          <Controller control={control} name="desiredOutcome" render={({ field }) => <PlateEditor initialValue={field.value || ''} onChange={field.onChange} variant="basic" />} />
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
          {errors.status && <p className="text-red-500 text-xs">{errors.status.message}</p>}
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
          {errors.source && <p className="text-red-500 text-xs">{errors.source.message}</p>}
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Type</Label>
          <div>
            <Input className="w-60" {...register('type')} />
            <p className="text-xs mt-2">For example: compliance, financial, operational</p>
          </div>
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Administrative (inherit)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrative">Administrative (inherit)</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="border-b flex items-center py-2.5">
          <Label className="min-w-36">Subcategory</Label>
          <Select {...register('subcategory')}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Administrative (inherit)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Administrative">Administrative (inherit)</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center py-2.5">
          <Label className="min-w-36">Version</Label>
          <Input disabled value="v0.0.1" />
        </div>
      </div>
    </form>
  )
}
