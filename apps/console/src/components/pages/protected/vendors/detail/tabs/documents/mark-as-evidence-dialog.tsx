'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetEntityAssociations } from '@/lib/graphql-hooks/entity'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

const markAsEvidenceSchema = z.object({
  name: z.string().min(1, 'Evidence name is required'),
})

type MarkAsEvidenceFormData = z.infer<typeof markAsEvidenceSchema>

const ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL] as const

interface MarkAsEvidenceDialogProps {
  fileId: string
  fileName: string
  vendorId: string
  onClose: () => void
}

const MarkAsEvidenceDialog: React.FC<MarkAsEvidenceDialogProps> = ({ fileId, fileName, vendorId, onClose }) => {
  const openObjectSheet = useOpenObjectSheet()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const [selectedIds, setSelectedIds] = useState<TObjectAssociationMap>({})
  const { data: associationsData, isLoading: controlsLoading } = useGetEntityAssociations(vendorId)

  const vendorControls = useMemo(() => {
    return associationsData?.entity?.controls?.edges?.map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => node != null) ?? []
  }, [associationsData])

  const form = useForm<MarkAsEvidenceFormData>({
    resolver: zodResolver(markAsEvidenceSchema),
    defaultValues: {
      name: fileName,
    },
  })

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setSelectedIds(updatedMap)
  }, [])

  const toggleControl = useCallback((controlId: string) => {
    setSelectedIds((prev) => {
      const currentIds = prev.controlIDs ?? []
      const newIds = currentIds.includes(controlId) ? currentIds.filter((id) => id !== controlId) : [...currentIds, controlId]
      return { ...prev, controlIDs: newIds }
    })
  }, [])

  const handleSubmit = async (data: MarkAsEvidenceFormData) => {
    const controlIDs = selectedIds.controlIDs ?? []
    const subcontrolIDs = selectedIds.subcontrolIDs ?? []

    try {
      const result = await createEvidence({
        input: {
          name: data.name,
          source: 'Vendor Documents',
          fileIDs: [fileId],
          ...(controlIDs.length > 0 ? { controlIDs } : {}),
          ...(subcontrolIDs.length > 0 ? { subcontrolIDs } : {}),
        },
      })

      const evidenceId = result.createEvidence.evidence.id
      successNotification({
        title: 'Marked as evidence',
        description: (
          <span>
            &quot;{data.name}&quot; has been created as evidence. <ObjectSheetLink id={evidenceId} kind={ObjectAssociationNodeEnum.EVIDENCE} label="View evidence" onOpenSheet={openObjectSheet} />
          </span>
        ),
      })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-175" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Mark as Evidence</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Evidence Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g. "SOC 2 report for AWS"' />
                  </FormControl>
                  {form.formState.errors.name?.message && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
                </FormItem>
              )}
            />

            {controlsLoading ? (
              <p className="text-sm text-muted-foreground">Loading controls...</p>
            ) : vendorControls.length > 0 ? (
              <div className="space-y-2">
                <FormLabel className="mb-4 block border-b pb-1">Attach to Controls</FormLabel>
                <div className="max-h-50 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                  {vendorControls.map((control) => (
                    <label key={control.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox checked={(selectedIds.controlIDs ?? []).includes(control.id)} onCheckedChange={() => toggleControl(control.id)} />
                      <span>{control.refCode}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <FormLabel className="mb-4 block border-b pb-1">Add Controls</FormLabel>
                <ObjectAssociation onIdChange={handleIdChange} allowedObjectTypes={ALLOWED_OBJECT_TYPES} defaultSelectedObject={ObjectTypeObjects.CONTROL} />
              </>
            )}

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={isPending} isSaving={isPending} title="Create Evidence" savingTitle="Creating..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default MarkAsEvidenceDialog
