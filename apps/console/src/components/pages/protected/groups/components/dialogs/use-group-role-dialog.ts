import { useState } from 'react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useGetGroupDetails } from '@/lib/graphql-hooks/group'
import { canEdit } from '@/lib/authz/utils'
import { useSession } from 'next-auth/react'

export const useGroupRoleDialog = () => {
  const { selectedGroup } = useGroupsStore()
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const { data } = useGetGroupDetails(selectedGroup)
  const [open, setOpen] = useState(false)

  const isManaged = data?.group?.isManaged
  const groupName = data?.group?.displayName || data?.group?.name

  return {
    open,
    setOpen,
    selectedGroup,
    groupName: groupName ?? undefined,
    currentRoleNames: data?.group?.additionalRoles ?? [],
    disabled: !!isManaged || !canEdit(orgPermission?.roles, session),
  }
}
