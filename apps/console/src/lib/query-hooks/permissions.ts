import { type TAccessRole, type TPermissionData, type TScopesResponse } from '@/types/authz'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { objectToSnakeCase } from '../../utils/strings'
import { useFetchWithRetry, getIsSessionInvalid } from '@/lib/graphqlClient'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { isImpersonation } from '@/lib/authz/utils'

const FULL_ACCESS_ROLES: TAccessRole[] = Object.values(AccessEnum)

const FULL_ACCESS_PERMISSION: TPermissionData = { success: true, roles: FULL_ACCESS_ROLES }

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

export const useOrganizationRoles = () => {
  const fetchWithRetry = useFetchWithRetry()
  const { data: session } = useSession()

  const resp = useQuery<TPermissionData>({
    queryKey: ['organizationRole', session?.user?.activeOrganizationId],
    enabled: !isImpersonation(session),
    retry: shouldRetryPermission,
    placeholderData: undefined,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/organization-roles', { method: 'GET' })
      return readPermissionResponse<TPermissionData>(res, 'Failed to fetch organization roles')
    },
  })

  usePermissionQueryErrorLog(resp, 'Failed to fetch organization roles')

  return resp
}

const useOrgRolesGrantFullAccess = (): boolean => {
  const { data: orgPermission } = useOrganizationRoles()

  return orgPermission?.roles?.includes(AccessEnum.FullAccess) ?? false
}

export const useHasOrgFullAccess = (): boolean => {
  const { data: session } = useSession()
  const orgRolesGrantFullAccess = useOrgRolesGrantFullAccess()

  return !!isImpersonation(session) || orgRolesGrantFullAccess
}

export const useAccountRoles = (objectType: string, id?: string | number | null, enabled: boolean = true) => {
  const fetchWithRetry = useFetchWithRetry()
  const { data: session } = useSession()
  const hasOrgFullAccess = useOrgRolesGrantFullAccess()

  const snakeCaseObjectType = objectToSnakeCase(objectType)
  const isRequested = !!snakeCaseObjectType && !!id && enabled && !isImpersonation(session)

  const resp = useQuery<TPermissionData>({
    queryKey: ['accountRoles', snakeCaseObjectType, id, hasOrgFullAccess],
    enabled: isRequested && !hasOrgFullAccess,
    retry: shouldRetryPermission,
    placeholderData: undefined,
    initialData: isRequested && hasOrgFullAccess ? FULL_ACCESS_PERMISSION : undefined,
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

type TAccountRolesManyResponse = {
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
  const hasOrgFullAccess = useOrgRolesGrantFullAccess()

  const idsKey = [...new Set(ids.filter(Boolean))].sort().join(',')
  const objectIds = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey])
  const isRequested = !!objectType && objectIds.length > 0 && enabled && !isImpersonation(session)

  const fullAccessObjectRoles = useMemo<TAccountRolesManyResponse | undefined>(
    () => (isRequested && hasOrgFullAccess ? { success: true, roles: null, object_roles: Object.fromEntries(objectIds.map((objectId) => [objectId, FULL_ACCESS_ROLES])) } : undefined),
    [isRequested, hasOrgFullAccess, objectIds],
  )

  const resp = useQuery<TAccountRolesManyResponse>({
    queryKey: ['accountRolesMany', objectType, idsKey, hasOrgFullAccess],
    enabled: isRequested && !hasOrgFullAccess,
    retry: shouldRetryPermission,
    placeholderData: undefined,
    initialData: fullAccessObjectRoles,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/permissions/account-roles', {
        method: 'POST',
        body: JSON.stringify({
          object_type: objectType,
          object_ids: objectIds,
        }),
      })
      return readPermissionResponse<TAccountRolesManyResponse>(res, 'Failed to fetch roles')
    },
  })

  usePermissionQueryErrorLog(resp, 'Failed to fetch account roles for multiple objects')

  return resp
}
