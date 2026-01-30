import { useQuery } from '@tanstack/react-query'
import { jsonContentType } from '../auth/utils/secure-fetch'

// SnapshotResponse represents the structure of the response from the snapshot API
interface SnapshotResponse {
  data: {
    success: boolean
    image?: string
    mimeType?: string
    message?: string
  }
  status?: string
}

// UseSnapshotParams defines the parameters for the useSnapshot hook
interface UseSnapshotParams {
  url: string
}

// useSnapshot fetches a snapshot image for a given URL from the /api/snapshot endpoint
export const useSnapshot = ({ url }: UseSnapshotParams) => {
  const resp = useQuery<SnapshotResponse>({
    queryKey: ['snapshot', url],
    enabled: !!url,
    queryFn: async () => {
      const response = await fetch('/api/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': jsonContentType,
        },
        body: JSON.stringify({ url }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Snapshot fetch error response:', result)
      }

      return result as SnapshotResponse
    },
  })

  return resp
}
