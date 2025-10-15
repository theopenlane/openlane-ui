import { useNotification } from '@/hooks/useNotification'
import { TData } from '@/types/authz'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

export const useAccountRoles = (objectType: string, id?: string | number | null) => {
  const { errorNotification } = useNotification()

  const resp = useQuery<TData>({
    queryKey: ['accountRoles', objectType, id],
    enabled: !!objectType && !!id,
    queryFn: async () => {
      const res = await fetch('/api/permissions/account-roless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_type: objectType,
          object_id: id,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to fetch roles')
      }

      const data: TData = await res.json()
      return data
    },
  })
  useEffect(() => {
    if (resp.isError) {
      errorNotification({
        title: 'Error occurred while fetching account roles',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])
  return resp
}

export const useOrganizationRoles = () => {
  const { errorNotification } = useNotification()
  const resp = useQuery<TData>({
    queryKey: ['organizationRole'],
    queryFn: async () => {
      const res = await fetch('/api/permissions/organization-roles', {
        method: 'GET',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => {})
        throw new Error(err.error ?? 'Failed to fetch organization roles')
      }

      const data: TData = await res.json()
      return data
    },
  })
  useEffect(() => {
    if (resp.isError) {
      errorNotification({
        title: 'Error occurred while fetching organization roles',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])
  return resp
}
