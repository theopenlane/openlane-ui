'use client'

import { useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { StepDialog } from '@/components/shared/crud-base/step-dialog'
import type { StepConfig } from '@/components/shared/crud-base/types'
import { Callout } from '@/components/shared/callout/callout'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { useCreateBulkCSVControl } from '@/lib/graphql-hooks/control'
import { useOrganization } from '@/hooks/useOrganization'
import { consumeOnboardingImportControlsFlag } from '@/lib/storage/onboarding-import'
import { exportCSV } from '@/lib/export'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'

const formSchema = z.object({
  file: z.instanceof(File, { message: 'Please upload a CSV file' }),
})

type FormData = z.infer<typeof formSchema>

const WhyStep = () => (
  <Callout title="CSV Format">
    You told us you already have controls documented. Upload a CSV containing them — refer to our{' '}
    <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/onboarding/controls`} target="_blank" rel="noreferrer" className="text-brand hover:underline">
      documentation
    </a>{' '}
    for column format, or download a{' '}
    <a className="text-brand hover:underline cursor-pointer" onClick={() => exportCSV({ filename: 'control' })}>
      template csv file
    </a>{' '}
    to fill out.
  </Callout>
)

const UploadStep = () => {
  const { setValue, formState } = useFormContext<FormData>()

  const handleUpload = (uploaded: TUploadedFile) => {
    setValue('file', uploaded.file ?? new File([], ''), { shouldValidate: true })
  }

  return (
    <div className="space-y-2">
      <FileUpload
        acceptedFileTypes={['text/csv']}
        acceptedFileTypesShort={['CSV']}
        maxFileSizeInMb={1}
        onFileUpload={handleUpload}
        multipleFiles={false}
        acceptedFilesClass="flex justify-between text-sm"
      />
      {formState.errors.file && <p className="text-sm text-red-500">{formState.errors.file.message}</p>}
    </div>
  )
}

const steps: StepConfig[] = [
  { id: 'why', label: 'Import controls', schema: z.object({}), render: () => <WhyStep /> },
  { id: 'upload', label: 'Upload', schema: z.object({ file: formSchema.shape.file }), render: () => <UploadStep /> },
]

type Props = { onClose: () => void }

export const OnboardingImportControlsWizard = ({ onClose }: Props) => {
  const { currentOrgId } = useOrganization()
  const form = useForm<FormData>({ resolver: zodResolver(formSchema) })
  const rawMutation = useCreateBulkCSVControl()

  const createMutation = {
    isPending: rawMutation.isPending,
    mutateAsync: async (input: { input: File }) => {
      const result = await rawMutation.mutateAsync(input)
      consumeOnboardingImportControlsFlag(currentOrgId)
      return result
    },
  }

  return (
    <StepDialog<FormData, { input: File }, unknown>
      objectType={ObjectTypes.CONTROL}
      form={form}
      steps={steps}
      title="Import Your Controls"
      dialogClassName="sm:max-w-[640px] bg-secondary"
      createMutation={createMutation}
      buildPayload={async (data) => ({ input: data.file })}
      onClose={onClose}
    />
  )
}
