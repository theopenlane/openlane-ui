'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { FileUp, InfoIcon, Repeat, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { acceptedFileTypes, acceptedFileTypesShort } from '@/components/pages/protected/evidence/upload/evidence-upload-config.ts'
import { Form, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { InputRow } from '@repo/ui/input'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateEvidence, useGetRenewEvidenceById } from '@/lib/graphql-hooks/evidence'
import { TUploadedFile } from './upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TEvidenceRenewDialog = {
  controlId?: string
  evidenceId: string
}

const EvidenceRenewDialog: React.FC<TEvidenceRenewDialog> = ({ evidenceId, controlId }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const queryClient = useQueryClient()
  const { form } = useFormSchema()
  const { successNotification, errorNotification } = useNotification()
  const { evidence } = useGetRenewEvidenceById(evidenceId, isOpen)
  const { mutateAsync: createEvidence, isPending: isSubmitting } = useCreateEvidence()
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFile[]>([])
  const { convertToHtml } = usePlateEditor()

  useEffect(() => {
    if (evidence) {
      form.reset({
        name: evidence.name,
        description: evidence.description ?? '',
        tags: evidence.tags ?? [],
        collectionProcedure: evidence.collectionProcedure as string,
        source: evidence.source ?? '',
        ...(evidence.url ? { url: evidence.url } : {}),
        controlObjectiveIDs: evidence?.controlObjectives?.edges?.map((item) => item?.node?.id) || [],
        controlIDs: evidence?.controls?.edges?.map((item) => item?.node?.id) || [],
        programIDs: evidence?.programs?.edges?.map((item) => item?.node?.id) || [],
        subcontrolIDs: evidence?.subcontrols?.edges?.map((item) => item?.node?.id) || [],
        taskIDs: evidence?.tasks?.edges?.map((item) => item?.node?.id) || [],
      })
    }
  }, [evidence, form])

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    let collectionProcedure
    if (data.collectionProcedure) {
      collectionProcedure = await convertToHtml(data.collectionProcedure as Value)
    }

    try {
      await createEvidence({
        input: { ...data, collectionProcedure },
        evidenceFiles: evidenceFiles?.map((item) => item.file) || [],
      })
      setIsOpen(false)
      if (controlId) {
        queryClient.invalidateQueries({ queryKey: ['controls', controlId] })
      }
      queryClient.invalidateQueries({ queryKey: ['evidences'] })
      successNotification({
        title: 'Evidence Created',
        description: `Evidence has been successfully created`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setEvidenceFiles((prev) => [uploadedFile, ...prev])
  }

  const handleDelete = (file: TUploadedFile) => {
    setEvidenceFiles((prev) => {
      return prev.filter((evidenceFile) => evidenceFile.name !== file.name)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-8 p-2" icon={<Repeat />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
          Renew
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Renew Evidence</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 gap-4">
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="creationDate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="mb-2 flex items-center">
                      Creation Date
                      <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>The date the evidence was collected, generally the current date but can be adjusted.</p>} />
                    </FormLabel>
                    <CalendarPopover field={field} defaultToday required />
                    {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>

            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="mb-2 flex items-center">
                      Renewal Date
                      <SystemTooltip
                        icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                        content={<p>The date the evidence will be re-requested; some evidence may be monthly (e.g. user access reviews), bi-annually, or annually, depending</p>}
                      />
                    </FormLabel>

                    <CalendarPopover field={field} defaultAddDays={365} />
                    {field.value !== null && (
                      <p>
                        Don&apos;t want to renew this evidence?{' '}
                        <b className="text-sm cursor-pointer text-primary" onClick={() => field.onChange(null)}>
                          Clear it
                        </b>
                      </p>
                    )}
                    {form.formState.errors.renewalDate && <p className="text-red-500 text-sm">{form.formState.errors.renewalDate.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
          </form>
        </Form>

        <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleUploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={100} multipleFiles={true} />
        {evidenceFiles.map((file, index) => (
          <div key={index} className="border rounded-sm p-3 mt-4 flex items-center justify-between bg-secondary">
            <div className="flex items-center flex-1 min-w-0">
              <div className="mr-2">
                <FileUp className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-sm">Size: {Math.round(file.size! / 1024)} KB</div>
              </div>
            </div>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDelete(file)} />
          </div>
        ))}
        <div className="flex gap-2 justify-end">
          <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
          <CancelButton disabled={isSubmitting} onClick={() => setIsOpen(false)}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { EvidenceRenewDialog }
