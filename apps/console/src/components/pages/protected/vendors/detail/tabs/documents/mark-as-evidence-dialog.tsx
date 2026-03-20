'use client'

import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
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

const MarkAsEvidenceDialog: React.FC<MarkAsEvidenceDialogProps> = ({ fileId, fileName, vendorId: _vendorId, onClose }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const [selectedIds, setSelectedIds] = useState<TObjectAssociationMap>({})

  const form = useForm<MarkAsEvidenceFormData>({
    resolver: zodResolver(markAsEvidenceSchema),
    defaultValues: {
      name: fileName,
    },
  })

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setSelectedIds(updatedMap)
  }, [])

  const openEvidence = (evidenceId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', evidenceId)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

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
            &quot;{data.name}&quot; has been created as evidence.{' '}
            <button type="button" className="underline font-medium cursor-pointer bg-transparent border-0 p-0" onClick={() => openEvidence(evidenceId)}>
              View evidence
            </button>
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
      <DialogContent className="sm:max-w-175">
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

            <FormLabel className="mb-4 block border-b pb-1">Add Controls</FormLabel>
            <ObjectAssociation onIdChange={handleIdChange} allowedObjectTypes={ALLOWED_OBJECT_TYPES} defaultSelectedObject={ObjectTypeObjects.CONTROL} />

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
