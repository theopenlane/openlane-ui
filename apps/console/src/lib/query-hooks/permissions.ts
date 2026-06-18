import { useNotification } from '@/hooks/useNotification'
import { type TAccessRole, type TPermissionData, type TScopesResponse } from '@/lib/authz/types'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { objectToSnakeCase } from '../../utils/strings'
import { useFetchWithRetry, getIsSessionInvalid } from '@/lib/graphqlClient'

const readPermissionResponse = async <T>(res: Response, fallbackError: string): Promise<T> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? fallbackError)
  }
  return res.json() as Promise<T>
}

const shouldRetryPermission = (failureCount: number): boolean => !getIsSessionInvalid() && failureCount < 5

export const useAccountRoles = (objectType: string, id?: string | number | null, enabled: boolean = true) => {
  const { errorNotification } = useNotification()
  const fetchWithRetry = useFetchWithRetry()

  const snakeCaseObjectType = objectToSnakeCase(objectType)

  const resp = useQuery<TPermissionData>({
    queryKey: ['accountRoles', snakeCaseObjectType, id],
    enabled: !!snakeCaseObjectType && !!id && enabled,
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/account-roles', {
        method: 'POST',
        body: JSON.stringify({
          object_type: snakeCaseObjectType,
          object_id: id,
        }),
      })
      return readPermissionResponse<TPermissionData>(res, 'Failed to fetch roles')
    },
  })
  useEffect(() => {
    if (resp.isError && !getIsSessionInvalid()) {
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
  const fetchWithRetry = useFetchWithRetry()

  const resp = useQuery<TPermissionData>({
    queryKey: ['organizationRole'],
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/organization-roles', { method: 'GET' })
      return readPermissionResponse<TPermissionData>(res, 'Failed to fetch organization roles')
    },
  })
  useEffect(() => {
    if (resp.isError && !getIsSessionInvalid()) {
      errorNotification({
        title: 'Error occurred while fetching organization roles',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])
  return resp
}

export const useScopes = () => {
  const { errorNotification } = useNotification()
  const fetchWithRetry = useFetchWithRetry()

  const resp = useQuery<TScopesResponse>({
    queryKey: ['scopes'],
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/scopes', { method: 'GET' })
      return readPermissionResponse<TScopesResponse>(res, 'Failed to fetch scopes')
    },
  })

  useEffect(() => {
    if (resp.isError && !getIsSessionInvalid()) {
      errorNotification({
        title: 'Error occurred while fetching scopes',
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
  const fetchWithRetry = useFetchWithRetry()

  const resp = useQuery<useAccountRolesManyResponse>({
    queryKey: ['accountRolesMany', objectType, ids.sort().join('')],
    enabled: !!objectType && ids.length > 0 && enabled,
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/account-roles', {
        method: 'POST',
        body: JSON.stringify({
          object_type: objectType,
          object_ids: ids,
        }),
      })
      return readPermissionResponse<useAccountRolesManyResponse>(res, 'Failed to fetch roles')
    },
  })

  useEffect(() => {
    if (resp.isError && !getIsSessionInvalid()) {
      errorNotification({
        title: 'Error occurred while fetching account roles',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])

  return resp
}
