import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { buildLoginRedirect } from '@/lib/auth/utils/redirect'

export type TfaLoginTokens = {
  access_token: string
  refresh_token: string
  session: string
}

export const useVerifyTotp = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  return useMutation<TfaLoginTokens | undefined, Error, { totp_code?: string; recovery_code?: string }>({
    retry: false,
    mutationFn: async (payload) => {
      const response = await secureFetch('/api/auth/verify-totp', { method: 'POST', body: JSON.stringify(payload) })

      if (response.status === 401) {
        const login = new URL(buildLoginRedirect(searchParams.get('redirect')), window.location.origin)
        login.searchParams.set('cleartfa', '1')
        login.searchParams.set('error', 'Your login attempt expired. Please sign in again.')
        router.replace(`${login.pathname}${login.search}`)
        return
      }

      const data = await response.json()
      if (!response.ok || !data.access_token || !data.refresh_token || !data.session) {
        throw new Error(data.message || 'Invalid authentication token entered! Please use the token provided by your authentication app')
      }

      return { access_token: data.access_token, refresh_token: data.refresh_token, session: data.session }
    },
  })
}
