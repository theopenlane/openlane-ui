'use client'

import { useCallback } from 'react'
import { signOut, type SignOutParams } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { clearSessionExpired, markSessionExpired } from '@/lib/auth/utils/session-status'
import { invalidateCSRFToken } from '@/lib/auth/utils/secure-fetch'
import { clearAllCachedOrganizationRoles } from '@/lib/authz/organization-roles-cache'

export const useSignOut = () => {
  const queryClient = useQueryClient()

  return useCallback(
    async (options?: SignOutParams<boolean>): Promise<void> => {
      markSessionExpired()
      invalidateCSRFToken()
      queryClient.clear()
      clearAllCachedOrganizationRoles()

      try {
        if (options?.redirect === false) {
          await signOut({ ...options, redirect: false })

          return
        }

        await signOut({ ...options, redirect: true })
      } catch (error) {
        clearSessionExpired()

        throw error
      }
    },
    [queryClient],
  )
}
