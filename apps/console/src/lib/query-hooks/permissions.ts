import { useQuery } from '@tanstack/react-query'
import { TData } from '../authz/access-api'

export const useAccountRoles = (objectType: string, id?: string | number | null) => {
  return useQuery<TData>({
    queryKey: ['accountRoles', objectType, id],
    enabled: !!objectType && !!id,
    queryFn: async () => {
      const res = await fetch('/api/permissions/account-roles', {
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
}

export const useOrganizationRoles = () => {
  return useQuery<TData>({
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
}
