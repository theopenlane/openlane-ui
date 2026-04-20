'use client'

import React, { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Controller } from 'react-hook-form'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { type ControlImplementationFieldsFragment, type UpdateControlImplementationInput } from '@repo/codegen/src/schema'
import { useGetControlImplementationById, useUpdateControlImplementation, useDeleteControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { ControlImplementationCard } from './control-implementation-card'
import { LinkControlsModal } from './link-controls-modal'
import { GenericDetailsSheet, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import useFormSchema, { type TFormData } from './form/use-form-schema'
import { ControlImplementationStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'

type Props = {
  queryParamKey?: string
  entityId?: string | null
  onClose?: () => void
}

const ControlImplementationDetailsSheet: React.FC<Props> = ({ queryParamKey = 'controlImplementationId', entityId: entityIdProp, onClose: onCloseProp }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityIdFromUrl = searchParams.get(queryParamKey)
  const entityId = entityIdProp !== undefined ? entityIdProp : entityIdFromUrl

  const [detailsOpen, setDetailsOpen] = useState(true)

  const { data: node, isLoading } = useGetControlImplementationById(entityId)
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()

  const baseUpdateMutation = useUpdateControlImplementation()
  const baseDeleteMutation = useDeleteControlImplementation()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateControlImplementationInput }) => baseUpdateMutation.mutateAsync({ updateControlImplementationId: params.id, input: params.input }),
  }

  const deleteMutation = {
    isPending: baseDeleteMutation.isPending,
    mutateAsync: async ({ ids }: { ids: string[] }) => {
      await Promise.all(ids.map((id) => baseDeleteMutation.mutateAsync({ deleteControlImplementationId: id })))
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
    (data: ControlImplementationFieldsFragment): Partial<TFormData> => ({
      details: data.details ?? '',
      status: data.status ?? undefined,
      implementationDate: data.implementationDate ? new Date(data.implementationDate) : undefined,
    }),
    [],
  )

  const buildPayload = useCallback(
    async (formData: TFormData): Promise<UpdateControlImplementationInput> => {
      const details = formData.details ? await plateEditorHelper.convertToHtml(formData.details as Value) : undefined
      return {
        details,
        status: formData.status,
        implementationDate: formData.implementationDate,
      }
    },
    [plateEditorHelper],
  )

  const renderFields = useCallback(
    ({ isEditing, data, isFormInitialized }: RenderFieldsProps<ControlImplementationFieldsFragment, UpdateControlImplementationInput>) => {
      if (!isEditing) return null
      const { control } = form
      return (
        <div className="p-4 border rounded-lg">
          <div className="border-b flex items-center py-2.5">
            <Label className="self-start whitespace-nowrap min-w-36">Details</Label>
            <Controller
              control={control}
              name="details"
              render={({ field }) => <PlateEditor initialValue={isFormInitialized ? (data?.details ?? undefined) : undefined} onChange={(val) => field.onChange(val)} />}
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
                    {ControlImplementationStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center py-2.5">
            <Label className="min-w-36">Date Implemented</Label>
            <div className="w-48">
              <Controller name="implementationDate" control={form.control} render={({ field }) => <CalendarPopover field={field} disabledFrom={new Date()} defaultToday />} />
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
      {detailsOpen && (
        <ControlImplementationCard
          obj={node}
          actions={
            <LinkControlsModal
              updateControlImplementationId={node.id}
              initialData={{
                controlIDs: node.controls?.edges?.flatMap((edge) => edge?.node?.id || []),
                subcontrolIDs: node.subcontrols?.edges?.flatMap((edge) => edge?.node?.id || []),
              }}
            />
          }
        />
      )}
    </div>
  ) : null

  return (
    <GenericDetailsSheet
      objectType={ObjectTypes.CONTROL_IMPLEMENTATION}
      form={form}
      entityId={entityId}
      data={node}
      isFetching={isLoading}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      buildPayload={buildPayload}
      normalizeData={normalizeData}
      getName={() => null}
      renderFields={renderFields}
      extraContent={extraContent}
      onClose={handleClose}
    />
  )
}

export default ControlImplementationDetailsSheet
