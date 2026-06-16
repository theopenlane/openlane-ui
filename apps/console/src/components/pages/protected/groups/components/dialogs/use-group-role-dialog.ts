import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { useGetGroupDetails } from '@/lib/graphql-hooks/group'
import { canEdit } from '@/lib/authz/utils'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const useGroupRoleDialog = () => {
  const { selectedGroup } = useGroupsStore()
  const { data: permission } = useAccountRoles(ObjectTypes.GROUP, selectedGroup)
  const { data } = useGetGroupDetails(selectedGroup)
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const isManaged = data?.group?.isManaged
  const groupName = data?.group?.displayName || data?.group?.name

  const onSaved = useCallback(() => {
    if (selectedGroup) queryClient.invalidateQueries({ queryKey: ['groups', selectedGroup] })
  }, [queryClient, selectedGroup])

  return {
    open,
    setOpen,
    selectedGroup,
    groupName: groupName ?? undefined,
    currentRoleNames: data?.group?.additionalRoles ?? [],
    disabled: !!isManaged || !canEdit(permission?.roles),
    onSaved,
  }
}
