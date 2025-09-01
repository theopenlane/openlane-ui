import { useCreateExport, useGetAllExports } from '@/lib/graphql-hooks/export'
import { ExportExportFormat, ExportExportType, InputMaybe, Scalars } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification.tsx'

type TUseFileExportProps = {
  exportType: ExportExportType
  filters: string
  fields: InputMaybe<Array<Scalars['String']['input']>>
  format: ExportExportFormat
}

const useFileExport = () => {
  const { successNotification } = useNotification()
  const { mutateAsync: createExport, isPending } = useCreateExport()
  const { refetch } = useGetAllExports()

  const handleExport = async ({ exportType, filters, fields, format }: TUseFileExportProps) => {
    successNotification({
      title: `Your export has started. You’ll get a notification when your file is ready to download.`,
    })

    try {
      const data = await createExport({
        input: {
          exportType,
          filters,
          fields,
          format,
        },
      })
      refetch()

      return data.createExport.export.id
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      console.error(errorMessage)
      throw error
    }
  }

  return {
    handleExport,
    isPending,
  }
}

export default useFileExport
