import { useCreateExport } from '@/lib/graphql-hooks/export'
import { type ExportExportFormat, type ExportExportType, type InputMaybe, type Scalars } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification.tsx'

export type TExportMetadata = {
  excludePDFMetadata?: boolean
}

type TUseFileExportProps = {
  exportType: ExportExportType
  filters: string
  fields: InputMaybe<Array<Scalars['String']['input']>>
  format: ExportExportFormat
  exportMetadata?: TExportMetadata
}

const useFileExport = () => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createExport, isPending } = useCreateExport()

  const handleExport = async ({ exportType, filters, fields, format, exportMetadata }: TUseFileExportProps) => {
    try {
      const data = await createExport({
        input: {
          exportType,
          filters,
          fields,
          format,
          ...(exportMetadata ? { exportMetadata } : {}),
        },
      })

      successNotification({
        title: `Export Started`,
        description: `You'll get a notification when your file is ready to download.`,
      })

      return data.createExport.export.id
    } catch (error) {
      errorNotification({
        title: 'Export failed',
        description: parseErrorMessage(error),
      })
      return undefined
    }
  }

  return {
    handleExport,
    isPending,
  }
}

export default useFileExport
