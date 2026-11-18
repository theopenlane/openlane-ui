import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { type TAccessRole } from '@/types/authz'
import { useAccountRolesMany } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

export const useCanEditObjects = (objectType: ObjectTypes, ids: string[]): ((id: string) => boolean) => {
  const { data: session } = useSession()
  const [previousRoles, setPreviousRoles] = useState<Record<string, TAccessRole[]>>({})

  const { data } = useAccountRolesMany({ objectType, ids })

  const objectRoles = data?.object_roles

  useEffect(() => {
    if (!objectRoles) return
    setPreviousRoles((prev) => ({ ...prev, ...objectRoles }))
  }, [objectRoles])

  const rolesById = useMemo(() => ({ ...previousRoles, ...objectRoles }), [previousRoles, objectRoles])

  return useCallback((id: string) => canEdit(rolesById[id], session), [rolesById, session])
}
