import { useEffect, useMemo, useState } from 'react'
import { useGetAllExports } from '@/lib/graphql-hooks/export'
import { ExportExportStatus } from '@repo/codegen/src/schema'

export type TJob = {
  id: string
  title: string
  status: ExportExportStatus
  errorMessage: string
  progress: number
  downloadUrl: string | null
}

export function useTrackedExports() {
  const [enabled, setEnabled] = useState(true)
  // TODO: Once we get new notifications, dynamically enable/disable the hook
  const { data, isLoading, refetch } = useGetAllExports({ enabled })

  const jobs: TJob[] = useMemo(() => {
    return (
      data?.exports?.edges?.map((edge) => {
        const node = edge?.node
        let progress = 0

        switch (node?.status) {
          case ExportExportStatus.PENDING:
            progress = 50
            break
          case ExportExportStatus.READY:
          case ExportExportStatus.FAILED:
          case ExportExportStatus.NODATA:
            progress = 100
            break
        }

        return {
          id: node?.id,
          title: `Export ${node?.exportType.split('_').join(' ').toLowerCase()}`,
          status: node?.status,
          errorMessage: node?.errorMessage,
          progress,
          downloadUrl: node?.files?.edges?.[0]?.node?.presignedURL ?? null,
        } as TJob
      }) ?? []
    )
  }, [data])

  const hasPending = useMemo(() => jobs.some((j) => j.status === ExportExportStatus.PENDING), [jobs])

  useEffect(() => {
    if (!hasPending) {
      setEnabled(false)
      return
    }

    setEnabled(true)
    const interval = setInterval(() => {
      refetch()
    }, 5000)

    return () => clearInterval(interval)
  }, [hasPending, refetch])

  return { jobs, isLoading }
}
