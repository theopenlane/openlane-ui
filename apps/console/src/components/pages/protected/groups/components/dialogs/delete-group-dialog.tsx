'use client'
import React, { useState } from 'react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Trash2, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { useDeleteGroup, useGetGroupDetails } from '@/lib/graphql-hooks/group'
import { useQueryClient } from '@tanstack/react-query'
import GroupsDeletePermissionsTable from '../groups-delete-permissions-table'
import { useNotification } from '@/hooks/useNotification'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useSession } from 'next-auth/react'
import { Callout } from '@/components/shared/callout/callout'

const DeleteGroupDialog = () => {
  const { selectedGroup, setSelectedGroup } = useGroupsStore()
  const { data: session } = useSession()
  const { data: permission } = useAccountRoles(ObjectTypes.GROUP, selectedGroup)
  const [isOpen, setIsOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useGetGroupDetails(selectedGroup)
  const { id, name, isManaged } = data?.group || {}

  const { mutateAsync: deleteGroup } = useDeleteGroup()

  const handleDelete = async () => {
    if (!selectedGroup || !id) return

    try {
      await deleteGroup({ deleteGroupId: id })
      successNotification({ title: `Group "${name}" deleted successfully` })
      setSelectedGroup(null)
      setIsOpen(false)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Trash2 />} iconPosition="left" variant="secondary" disabled={!!isManaged || !canEdit(permission?.roles, session)}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete group</DialogTitle>
        </DialogHeader>

        <Callout variant="danger" title="Warning" compact>
          Please proceed with caution, because you will not be able to undo this action.
        </Callout>
        <p className="break-words">
          Are you sure you want to delete the group <span className="font-semibold">{name}</span> from your organization?
        </p>
        <div className="space-y-2.5 min-w-0">
          <p className="font-medium">Objects associated with the group</p>
          <p className="text-sm">All granted permissions to the group will be unassociated. No objects will be deleted.</p>
          <button type="button" aria-expanded={expanded} className="border rounded-lg flex gap-1 items-center py-1.5 px-3" onClick={() => setExpanded((prev) => !prev)}>
            <p>Show associated Objects</p>
            {expanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
          </button>
          {expanded && <GroupsDeletePermissionsTable />}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            Delete this group
          </Button>
          <CancelButton onClick={() => setIsOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteGroupDialog
