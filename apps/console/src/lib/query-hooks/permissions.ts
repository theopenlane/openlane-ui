import { type TAccessRole, type TPermissionData, type TScopesResponse } from '@/types/authz'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { objectToSnakeCase } from '../../utils/strings'
import { useFetchWithRetry, getIsSessionInvalid } from '@/lib/graphqlClient'

export const readPermissionResponse = async <T>(res: Response, fallbackError: string): Promise<T> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? fallbackError)
  }
  return res.json() as Promise<T>
}

export const shouldRetryPermission = (failureCount: number): boolean => !getIsSessionInvalid() && failureCount < 5

export const usePermissionQueryErrorLog = <TData>({ isError, error }: Pick<UseQueryResult<TData, Error>, 'isError' | 'error'>, context: string) => {
  useEffect(() => {
    if (!isError) {
      return
    }

    console.error(`${context}:`, error)
  }, [isError, error, context])
}

export const useAccountRoles = (objectType: string, id?: string | number | null, enabled: boolean = true) => {
  const fetchWithRetry = useFetchWithRetry()
  const { data: session } = useSession()
  const isImpersonation = !!session?.user?.isImpersonation

  const snakeCaseObjectType = objectToSnakeCase(objectType)

  const resp = useQuery<TPermissionData>({
    queryKey: ['accountRoles', snakeCaseObjectType, id],
    enabled: !!snakeCaseObjectType && !!id && enabled && !isImpersonation,
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/account-roles', {
        method: 'POST',
        body: JSON.stringify({
          object_type: snakeCaseObjectType,
          object_id: id,
        }),
      })
      const permission = await readPermissionResponse<TPermissionData>(res, 'Failed to fetch roles')
      return permission
    },
  })

  usePermissionQueryErrorLog(resp, 'Failed to fetch account roles')

  return resp
}

export const useOrganizationRoles = () => {
  const fetchWithRetry = useFetchWithRetry()
  const { data: session } = useSession()
  const isImpersonation = !!session?.user?.isImpersonation

  const resp = useQuery<TPermissionData>({
    queryKey: ['organizationRole'],
    enabled: !isImpersonation,
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/organization-roles', { method: 'GET' })
      return readPermissionResponse<TPermissionData>(res, 'Failed to fetch organization roles')
    },
  })

  usePermissionQueryErrorLog(resp, 'Failed to fetch organization roles')

  return resp
}

export const useScopes = () => {
  const fetchWithRetry = useFetchWithRetry()

  const resp = useQuery<TScopesResponse>({
    queryKey: ['scopes'],
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/scopes', { method: 'GET' })
      return readPermissionResponse<TScopesResponse>(res, 'Failed to fetch scopes')
    },
  })

  usePermissionQueryErrorLog(resp, 'Failed to fetch scopes')

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
  const fetchWithRetry = useFetchWithRetry()
  const { data: session } = useSession()
  const isImpersonation = !!session?.user?.isImpersonation

  const resp = useQuery<useAccountRolesManyResponse>({
    queryKey: ['accountRolesMany', objectType, ids.sort().join('')],
    enabled: !!objectType && ids.length > 0 && enabled && !isImpersonation,
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

  usePermissionQueryErrorLog(resp, 'Failed to fetch account roles for multiple objects')

  return resp
}
