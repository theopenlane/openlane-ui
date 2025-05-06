import { openlaneAPIUrl } from '@repo/dally/auth'
import { Session } from 'next-auth'
import { RelationEnum } from '@/lib/authz/enums/relation-enum.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import useSWR from 'swr'

export type TAccessRole =
  | 'can_create_standard'
  | 'can_create_evidence'
  | 'can_create_control'
  | 'can_create_narrative'
  | 'can_create_risk'
  | 'can_create_procedure'
  | 'can_create_group'
  | 'can_create_control_objective'
  | 'can_delete'
  | 'can_create_template'
  | 'can_invite_members'
  | 'can_create_subcontrol'
  | 'can_create_internal_policy'
  | 'audit_log_viewer'
  | 'can_create_program'
  | 'can_create_control_implementation'
  | 'can_view'
  | 'can_edit'
  | 'member'
  | 'owner'
  | 'access'
  | 'can_invite_admins'

type TData = {
  success?: boolean
  organization_id?: string
  roles: TAccessRole[]
}

interface IResponse {
  data: TData
  isLoading: boolean
  error: Error | null
}

export const useAccessPermission = (session: Session | null, relation: RelationEnum, objectType: ObjectEnum) => {
  const accessToken = session?.user?.accessToken
  const currentOrgId = session?.user?.activeOrganizationId

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  const payload = {
    relation,
    object_type: objectType,
    object_id: currentOrgId,
  }

  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      credentials: 'include',
    })
    return response.json()
  }

  const { data, error, isValidating } = useSWR(session ? `${openlaneAPIUrl}/v1/account/access` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    refreshInterval: 0,
    revalidateIfStale: false,
  })

  return {
    data,
    isLoading: isValidating,
    error,
  }
}

export const useAccountRole = (session: Session | null, objectType: ObjectEnum) => {
  const accessToken = session?.user?.accessToken
  const currentOrgId = session?.user?.activeOrganizationId

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  const payload = {
    object_type: objectType,
    object_id: currentOrgId,
  }

  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      credentials: 'include',
    })
    return response.json()
  }

  const { data, error, isValidating } = useSWR(session ? `${openlaneAPIUrl}/v1/account/roles` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    refreshInterval: 0,
    revalidateIfStale: false,
  })

  return {
    data,
    isLoading: isValidating,
    error,
  } as IResponse
}

export const useOrganizationRole = (session: Session | null) => {
  const accessToken = session?.user?.accessToken

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    })
    return response.json()
  }

  const { data, error, isValidating } = useSWR(session ? `${openlaneAPIUrl}/v1/account/roles/organization` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    refreshInterval: 0,
    revalidateIfStale: false,
  })

  return {
    data,
    isLoading: isValidating,
    error,
  } as IResponse
}
