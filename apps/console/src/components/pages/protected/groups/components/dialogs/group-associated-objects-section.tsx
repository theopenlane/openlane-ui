'use client'
import React, { useMemo, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetGroupPermissions } from '@/lib/graphql-hooks/group'
import GroupsDeletePermissionsTable, { type GroupPermissionRow } from '../groups-delete-permissions-table'

const GroupAssociatedObjectsSection = () => {
  const { selectedGroup } = useGroupsStore()
  const [expanded, setExpanded] = useState(false)

  const { data, isPending, isError } = useGetGroupPermissions(selectedGroup)

  const associatedObjects: GroupPermissionRow[] = useMemo(
    () =>
      data?.group.permissions.edges?.flatMap((edge) =>
        edge?.node
          ? [
              {
                id: edge.node.id,
                name: edge.node.name ?? 'Unknown',
                objectType: edge.node.objectType,
                permissions: edge.node.permissions,
              },
            ]
          : [],
      ) ?? [],
    [data],
  )

  if (isPending || (!isError && associatedObjects.length === 0)) {
    return null
  }

  return (
    <div className="space-y-2.5 min-w-0">
      <p className="font-medium">Objects associated with the group</p>
      <p className="text-sm">All granted permissions to the group will be unassociated. No objects will be deleted.</p>
      {!isError && (
        <>
          <button type="button" aria-expanded={expanded} className="border rounded-lg flex gap-1 items-center py-1.5 px-3" onClick={() => setExpanded((prev) => !prev)}>
            <p>Show associated Objects</p>
            {expanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
          </button>
          {expanded && <GroupsDeletePermissionsTable permissions={associatedObjects} />}
        </>
      )}
    </div>
  )
}

export default GroupAssociatedObjectsSection
