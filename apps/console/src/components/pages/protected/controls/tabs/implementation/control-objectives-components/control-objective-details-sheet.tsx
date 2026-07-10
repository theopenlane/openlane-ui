'use client'

import React, { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Controller } from 'react-hook-form'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { ControlObjectiveControlSource, ControlObjectiveObjectiveStatus, type ControlObjectiveFieldsFragment, type UpdateControlObjectiveInput } from '@repo/codegen/src/schema'
import { toHumanLabel } from '@/utils/strings'
import { useGetControlObjectiveById, useUpdateControlObjective, useDeleteControlObjective } from '@/lib/graphql-hooks/control-objective'
import { ControlObjectiveCard } from './control-objective-card'
import { LinkControlsModal } from './link-controls-modal'
import { GenericDetailsSheet, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import useFormSchema, { type TFormData } from './form/use-form-schema'
import { ControlObjectiveStatusOptions } from '@/components/shared/enum-mapper/control-objective-enum'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { VersionBump } from '@/lib/enums/revision-enum'

type Props = {
  queryParamKey?: string
  entityId?: string | null
  onClose?: () => void
}

const ControlObjectiveDetailsSheet: React.FC<Props> = ({ queryParamKey = 'controlObjectiveId', entityId: entityIdProp, onClose: onCloseProp }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityIdFromUrl = searchParams.get(queryParamKey)
  const entityId = entityIdProp !== undefined ? entityIdProp : entityIdFromUrl

  const [detailsOpen, setDetailsOpen] = useState(true)

  const { data: node, isLoading } = useGetControlObjectiveById(entityId)
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()

  const baseUpdateMutation = useUpdateControlObjective()
  const baseDeleteMutation = useDeleteControlObjective()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateControlObjectiveInput }) => baseUpdateMutation.mutateAsync({ updateControlObjectiveId: params.id, input: params.input }),
  }

  const deleteMutation = {
    isPending: baseDeleteMutation.isPending,
    mutateAsync: async ({ ids }: { ids: string[] }) => {
      await Promise.all(ids.map((id) => baseDeleteMutation.mutateAsync({ deleteControlObjectiveId: id })))
      return { deletedIDs: ids, notDeletedIDs: [] }
    },
  }

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const normalizeData = useCallback(
    (data: ControlObjectiveFieldsFragment): Partial<TFormData> => ({
      name: data.name ?? '',
      desiredOutcome: data.desiredOutcome ?? '',
      status: data.status ?? ControlObjectiveObjectiveStatus.DRAFT,
      source: data.source ?? ControlObjectiveControlSource.USER_DEFINED,
      controlObjectiveType: data.controlObjectiveType ?? '',
      category: data.category ?? '',
      subcategory: data.subcategory ?? '',
      revision: data.revision ?? '',
      RevisionBump: data.status === ControlObjectiveObjectiveStatus.DRAFT ? VersionBump.DRAFT : undefined,
    }),
    [],
  )

  const buildPayload = useCallback(
    async (formData: TFormData): Promise<UpdateControlObjectiveInput> => {
      const desiredOutcome = formData.desiredOutcome ? await plateEditorHelper.convertToHtml(formData.desiredOutcome as Value) : undefined
      return {
        name: formData.name,
        desiredOutcome,
        status: formData.status,
        source: formData.source,
        controlObjectiveType: formData.controlObjectiveType,
        category: formData.category,
        subcategory: formData.subcategory,
        RevisionBump: formData.RevisionBump,
      }
    },
    [plateEditorHelper],
  )

  const renderFields = useCallback(
    ({ isEditing, data, isFormInitialized }: RenderFieldsProps<ControlObjectiveFieldsFragment, UpdateControlObjectiveInput>) => {
      if (!isEditing) return null
      const {
        control,
        formState: { errors },
      } = form
      return (
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
              render={({ field }) => <PlateEditor initialValue={isFormInitialized ? (data?.desiredOutcome ?? undefined) : undefined} onChange={(val) => field.onChange(val)} />}
            />
          </div>

          <div className="border-b flex items-center py-2.5">
            <Label className="min-w-36">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
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
              )}
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
                        {toHumanLabel(value)}
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

          <div className="flex items-center py-2.5">
            <Label className="min-w-36">Revision</Label>
            <div className="flex flex-col">
              <Controller
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
              <p className="text-xs mt-2">Current version: {data?.revision ?? 'v0.0.1'}</p>
            </div>
          </div>
        </div>
      )
    },
    [form],
  )

  const extraContent = node ? (
    <div className="mt-4">
      <button className="flex items-center gap-1 text-sm font-medium w-full text-left mb-2" onClick={() => setDetailsOpen((o) => !o)}>
        {detailsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Details
      </button>
      {detailsOpen && <ControlObjectiveCard obj={node} actions={<LinkControlsModal controlObjectiveData={node} aria-label="Set associations" />} />}
    </div>
  ) : null

  return (
    <GenericDetailsSheet
      objectType={ObjectTypes.CONTROL_OBJECTIVE}
      form={form}
      entityId={entityId}
      data={node}
      isFetching={isLoading}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      buildPayload={buildPayload}
      normalizeData={normalizeData}
      getName={(data) => data.name}
      renderFields={renderFields}
      extraContent={extraContent}
      onClose={handleClose}
    />
  )
}

export default ControlObjectiveDetailsSheet
