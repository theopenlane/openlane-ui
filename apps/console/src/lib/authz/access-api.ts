import { openlaneAPIUrl } from '@repo/dally/auth'
import { Session } from 'next-auth'
import useSWR from 'swr'
import { RelationEnum } from '@/lib/authz/enums/relation-enum.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'

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
  }
}

export const useOrganizationRole = (session: Session | null) => {
  const accessToken = session?.user?.accessToken

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
    })
    return response.json()
  }

  const { data, error, isValidating } = useSWR(session ? `${openlaneAPIUrl}/v1/roles/organization` : null, fetcher, {
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
