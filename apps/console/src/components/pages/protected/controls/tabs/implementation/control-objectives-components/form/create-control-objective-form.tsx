'use client'

import React from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { useCreateControlObjective, useUpdateControlObjective } from '@/lib/graphql-hooks/control-objective'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { usePlateHydration } from '@/components/shared/plate/usePlateHydration'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TFormData } from './use-form-schema'
import { VersionBump } from '@/lib/enums/revision-enum'
import { ControlObjectiveSourceOptions, ControlObjectiveStatusOptions } from '@/components/shared/enum-mapper/control-objective-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { Callout } from '@/components/shared/callout/callout'

const versionBumpOptions = enumToOptions(VersionBump)

export const CreateControlObjectiveForm = ({
  formId,
  onSuccess,
  defaultValues,
  suggestedValues,
  form,
}: {
  formId: string
  onSuccess: () => void
  defaultValues?: Partial<TFormData> & { id: string }
  suggestedValues?: { name?: string; desiredOutcome?: string }
  form: UseFormReturn<TFormData>
}) => {
  const { id, subcontrolId } = useParams()
  const { successNotification, errorNotification } = useNotification()
  const isEditing = !!defaultValues
  const isSuggested = !isEditing && !!suggestedValues
  const { convertToHtml } = usePlateEditor()
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form

  const onDesiredOutcomeChange = usePlateHydration(form, 'desiredOutcome', defaultValues?.desiredOutcome ?? suggestedValues?.desiredOutcome)

  const { mutateAsync: createObjective } = useCreateControlObjective()
  const { mutateAsync: updateObjective } = useUpdateControlObjective()

  const onSubmit = async (data: TFormData) => {
    const desiredOutcome = typeof data.desiredOutcome === 'string' ? data.desiredOutcome || undefined : data.desiredOutcome ? await convertToHtml(data.desiredOutcome) : undefined

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

    try {
      if (isEditing) {
        await updateObjective({ updateControlObjectiveId: defaultValues.id, input: basePayload })
        successNotification({ title: 'Control Objective updated' })
      } else {
        await createObjective(creationPayload)
        successNotification({ title: 'Control Objective created' })
      }
      onSuccess()
    } catch (error) {
      errorNotification({ title: isEditing ? 'Update failed' : 'Create failed', description: parseErrorMessage(error) })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEditing && (
        <Callout variant="info" title="Not sure what to write?">
          Describe the goal this control is intended to achieve. Focus on the risk it addresses, the outcome it supports, and how it contributes to your overall security or compliance posture.
        </Callout>
      )}
      {isSuggested && (
        <Callout variant="recommendation" title="Suggested">
          The name and desired outcome below are prefilled starter suggestions. You should review and customize them for your organization before saving
        </Callout>
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
          <Controller
            control={control}
            name="desiredOutcome"
            render={({ field }) => <PlateEditor initialValue={defaultValues?.desiredOutcome ?? suggestedValues?.desiredOutcome} onChange={(val) => onDesiredOutcomeChange(val, field.onChange)} />}
          />
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
                  {ControlObjectiveSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          <div className="flex items-center py-2.5">
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
                      {versionBumpOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
