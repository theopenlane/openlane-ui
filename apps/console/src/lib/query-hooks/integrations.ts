import { useNotification } from '@/hooks/useNotification'
import { type IntegrationProvidersResponse } from '@/components/pages/protected/organization-settings/integrations/config'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

export const useIntegrationProviders = () => {
  const { errorNotification } = useNotification()

  const resp = useQuery<IntegrationProvidersResponse>({
    queryKey: ['integrationProviders'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/providers', {
        method: 'GET',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to fetch integration providers')
      }

      const data: IntegrationProvidersResponse = await res.json()
      return data
    },
  })

  useEffect(() => {
    if (resp.isError) {
      errorNotification({
        title: 'Error occurred while fetching integration providers',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])

  return resp
}
