'use client'

import React, { useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import { wordAcceptedFileTypes, wordAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import useReplaceDocumentFormSchema, { type ReplaceDocumentFormData } from './use-replace-document-form-schema'

type Props = {
  policy: InternalPolicyByIdFragment
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ReplaceDocumentDialog: React.FC<Props> = ({ policy, open, onOpenChange }) => {
  const { form } = useReplaceDocumentFormSchema()
  const { handleSubmit, control, setValue, reset, formState } = form
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updatePolicy, isPending } = useUpdateInternalPolicy()

  const selectedFile = useWatch({ control, name: 'file' })

  useEffect(() => {
    if (!open) reset({ file: undefined })
  }, [open, reset])

  const onSubmit = async (data: ReplaceDocumentFormData) => {
    if (!data.file) return

    try {
      await updatePolicy({
        updateInternalPolicyId: policy.id,
        input: {},
        internalPolicyFile: data.file,
      })
      successNotification({
        title: 'Document replaced',
        description: 'The policy document has been replaced.',
      })
      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Replace failed',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Replace document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {!selectedFile ? (
            <FileUpload
              acceptedFileTypes={wordAcceptedFileTypes}
              acceptedFileTypesShort={wordAcceptedFileTypesShort}
              maxFileSizeInMb={100}
              multipleFiles={false}
              onFileUpload={(uploaded) => {
                if (uploaded.file) setValue('file', uploaded.file, { shouldValidate: true })
              }}
            />
          ) : (
            <UploadedFileDetailsCard fileName={selectedFile.name} fileSize={selectedFile.size} index={0} handleDeleteFile={() => setValue('file', undefined, { shouldValidate: true })} />
          )}
          {formState.errors.file && <p className="text-sm text-red-500">{formState.errors.file.message}</p>}

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" loading={isPending} disabled={isPending || !selectedFile}>
              {isPending ? 'Replacing...' : 'Replace document'}
            </Button>
            <CancelButton onClick={() => onOpenChange(false)} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ReplaceDocumentDialog
