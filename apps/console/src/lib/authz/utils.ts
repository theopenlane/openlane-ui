import { openlaneAPIUrl } from '@repo/dally/auth'
import { Session } from 'next-auth'
import useSWR from 'swr'

enum RELATION {
  VIEW = 'can_view',
  EDIT = 'can_edit',
  DELETE = 'can_delete',
  ADMIN_INVITE = 'can_invite_admins',
}

enum OBJECT {
  ORGANIZATION = 'organization',
  PROGRAM = 'program',
  TASK = 'task',
  POLICY = 'internal_policy',
  PROCEDURE = 'procedure',
  GROUP = 'group',
}

/*
 * CheckTuple includes the payload required for the check access endpoint
 *
 * @objectId: the id of the object being checked, usually the organization id
 * @objectType: the type of the object being checked, usually organization
 * @relation: the relation being checked
 */
export type CheckTuple = {
  objectId: string
  objectType: string
  relation: string
}

/*
 * Returns if the current user has access to the specified relation
 * @param session: the current user's session
 * @param relation: the relation to check
 *
 */
export const useCheckPermissions = (session: Session | null, relation: RELATION, objectType: OBJECT) => {
  const accessToken = session?.user?.accessToken
  const currentOrgId = session?.user?.activeOrganizationId

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  const payload = {
    relation,
    objectType: objectType,
    objectId: currentOrgId,
    subjectType: 'user',
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

/*
 * Returns if the current user has access to the specified relation
 * @param session: the current user's session
//  */
export const useUserHasOrganizationEditPermissions = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.EDIT, OBJECT.ORGANIZATION)
}

/*
 * Returns if the current user has delete permissions for the organization
 * @param session: the current user's session
 */
export const useUserHasOrganizationDeletePermissions = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.DELETE, OBJECT.ORGANIZATION)
}

/*
 * Returns if the current user has permissions to invite admins
 * @param session: the current user's session
 */
export const useUserCanInviteAdmins = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.ADMIN_INVITE, OBJECT.ORGANIZATION)
}

export const useUserCanCreateProgram = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.VIEW, OBJECT.PROGRAM)
}

export const useUserCanDeleteTask = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.DELETE, OBJECT.TASK)
}

export const useUserCanCreatePolicy = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.VIEW, OBJECT.POLICY)
}

export const useUserCanEditPolicy = (session: Session | null) => {
  return useCheckPermissions(session, RELATION.EDIT, OBJECT.POLICY)
}
