import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type TAccessRole } from '@/types/authz'
import { useAccountRolesMany, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useHasOrgFullAccess } from '@/lib/authz/use-has-org-full-access'
import { canEdit } from '@/lib/authz/utils'

export const useCanEditTasks = (taskIds: string[]): ((taskId: string) => boolean) => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const hasOrgFullAccess = useHasOrgFullAccess()
  const [rolesByTaskId, setRolesByTaskId] = useState<Record<string, TAccessRole[]>>({})
  const dedupedTaskIds = useMemo(() => [...new Set(taskIds.filter(Boolean))], [taskIds])

  const { data: taskRoles } = useAccountRolesMany({
    objectType: ObjectTypes.TASK,
    ids: dedupedTaskIds,
    enabled: !!orgPermission && !hasOrgFullAccess && dedupedTaskIds.length > 0,
  })

  const objectRoles = taskRoles?.object_roles

  useEffect(() => {
    if (!objectRoles) return
    setRolesByTaskId((prev) => ({ ...prev, ...objectRoles }))
  }, [objectRoles])

  return useCallback((taskId: string) => hasOrgFullAccess || canEdit(rolesByTaskId[taskId], session), [hasOrgFullAccess, rolesByTaskId, session])
}
