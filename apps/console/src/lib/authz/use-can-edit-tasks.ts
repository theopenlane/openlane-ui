import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type TAccessRole } from '@/types/authz'
import { useAccountRolesMany } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

export const useCanEditTasks = (taskIds: string[]): ((taskId: string) => boolean) => {
  const { data: session } = useSession()
  const [previousRoles, setPreviousRoles] = useState<Record<string, TAccessRole[]>>({})

  const { data: taskRoles } = useAccountRolesMany({
    objectType: ObjectTypes.TASK,
    ids: taskIds,
  })

  const objectRoles = taskRoles?.object_roles

  useEffect(() => {
    if (!objectRoles) return
    setPreviousRoles((prev) => ({ ...prev, ...objectRoles }))
  }, [objectRoles])

  const rolesByTaskId = useMemo(() => ({ ...previousRoles, ...objectRoles }), [previousRoles, objectRoles])

  return useCallback((taskId: string) => canEdit(rolesByTaskId[taskId], session), [rolesByTaskId, session])
}
