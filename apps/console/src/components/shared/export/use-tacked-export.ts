import { useGetAllExports } from '@/lib/graphql-hooks/export'
import { ExportExportStatus } from '@repo/codegen/src/schema'

const STORAGE_KEY = 'exports-tracking'

export type TJob = {
  id: string
  title: string
  status: ExportExportStatus
  progress: number
  downloadUrl: string
}

export function useTrackedExports() {
  const ids: string[] = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      return parsed.map((e: { exportId: string }) => e.exportId)
    } catch {
      return []
    }
  })()

  const { data, isLoading } = useGetAllExports({ idIn: ids })

  const jobs =
    data?.exports?.edges?.map((edge) => {
      const node = edge?.node
      let progress = 0

      switch (node?.status) {
        case ExportExportStatus.PENDING:
          progress = 50
          break
        case ExportExportStatus.READY:
          progress = 100
          break
        case ExportExportStatus.FAILED:
        case ExportExportStatus.NODATA:
          progress = 100
          break
      }

      return {
        id: node?.id,
        title: `Export ${node?.id}`,
        status: node?.status,
        progress,
        downloadUrl: node?.files?.edges?.[0]?.node?.presignedURL ?? null,
      } as TJob
    }) ?? []

  return { jobs, isLoading }
}
