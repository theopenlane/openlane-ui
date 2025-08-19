import { useCreateExport } from '@/lib/graphql-hooks/export'
import { ExportExportFormat, ExportExportType, InputMaybe, Scalars } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TUseFileExportProps = {
  exportType: ExportExportType
  filters: string
  fields: InputMaybe<Array<Scalars['String']['input']>>
  format: ExportExportFormat
}

type TStorageKey = {
  exportId: string
  exportType: ExportExportType
}

const STORAGE_KEY = 'exports-tracking'

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

      const exportId = data.createExport.export.id

      const current: TStorageKey[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const next: TStorageKey[] = [...current, { exportId, exportType }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

      return exportId
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
