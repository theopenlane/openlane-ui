import { useNotification } from '@/hooks/useNotification'
import { TAccessRole, TData } from '@/types/authz'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { objectToSnakeCase } from '../../utils/strings'

export const useAccountRoles = (objectType: string, id?: string | number | null, enabled: boolean = true) => {
  const { errorNotification } = useNotification()

  // ensure objectType is in snake_case before sending to backend
  objectType = objectToSnakeCase(objectType)

  const resp = useQuery<TData>({
    queryKey: ['accountRoles', objectType, id],
    enabled: !!objectType && !!id && enabled,
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

type useAccountRolesManyResponse = {
  success: boolean
  roles: null
  object_roles: Record<string, TAccessRole[]>
}

type UseAccountRolesManyParams = {
  objectType: string
  ids: string[]
  enabled?: boolean
}

export const useAccountRolesMany = ({ objectType, ids, enabled = true }: UseAccountRolesManyParams) => {
  const { errorNotification } = useNotification()

  const resp = useQuery<useAccountRolesManyResponse>({
    queryKey: ['accountRolesMany', objectType, ids.sort().join('')],
    enabled: !!objectType && ids.length > 0 && enabled,
    queryFn: async () => {
      const res = await fetch('/api/permissions/account-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_type: objectType,
          object_ids: ids,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to fetch roles')
      }

      return res.json() as Promise<useAccountRolesManyResponse>
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
