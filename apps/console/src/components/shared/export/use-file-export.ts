import { useCreateExport } from '@/lib/graphql-hooks/export'
import { ExportExportFormat, ExportExportType, InputMaybe, Scalars } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TUseFileExportProps = {
  exportType: ExportExportType
  filters: string
  fields: InputMaybe<Array<Scalars['String']['input']>>
  format: ExportExportFormat
}

const useFileExport = () => {
  const { mutateAsync: createExport, isPending } = useCreateExport()

  const handleExport = async ({ exportType, filters, fields, format }: TUseFileExportProps) => {
    try {
      const data = await createExport({
        input: {
          exportType,
          filters,
          fields,
          format,
        },
      })

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
