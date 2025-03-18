'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { GlobeIcon, LockIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { GetAllGroupsQuery, User } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Group } from '../groups-page'
import { Avatar } from '@/components/shared/avatar/avatar'

interface Props {
  queryResult: GetAllGroupsQuery | undefined
  isPending: boolean
  isError: boolean
}

const MyGroupsCard = ({ queryResult, isPending, isError }: Props) => {
  const { setSelectedGroup } = useGroupsStore()

  const transformedData =
    queryResult?.groups?.edges
      ?.map((edge) => edge?.node)
      .filter((group) => !!group)
      .map((group) => ({
        id: group.id,
        name: group.displayName,
        description: group.description || 'No description',
        tags: group.tags || [],
        visibility: group.setting?.visibility || 'UNKNOWN',
        members: group.members || [],
        isManaged: group.isManaged,
      })) || []

  const handleRowClick = (group: Group) => {
    setSelectedGroup(group.id)
  }

  if (isPending) {
    return <p>Loading groups...</p>
  }

  if (isError) {
    return <p className="text-red-500">Error loading groups</p>
  }

  return (
    <div className="mt-5 flex flex-wrap gap-7">
      {transformedData.length > 0 ? (
        transformedData.map((group) => (
          <Card key={group.id} className="w-full max-w-md cursor-pointer" onClick={() => handleRowClick(group as Group)}>
            <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
              <h3 className="font-semibold truncate">{group.name}</h3>
              <div className="flex gap-2  items-center">
                {group.isManaged && <p className="text-text-light text-normal">Prebuilt</p>}
                {group.visibility === 'PUBLIC' ? <GlobeIcon className="h-5 w-5 " /> : <LockIcon className="h-5 w-5 " />}
              </div>
            </div>
            <div className="py-3 px-4 pb-5">
              <p className="text-sm mb-3 line-clamp-3 overflow-hidden text-ellipsis">{group.description}</p>{' '}
              {group.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {group.members.length > 0 ? (
                <div className="flex items-center gap-2">
                  {group.members.map((member: any, index: number) => {
                    return <Avatar key={index} className="h-8 w-8" entity={member.user as User} />
                  })}
                </div>
              ) : (
                <p className="">No members</p>
              )}
            </div>
          </Card>
        ))
      ) : (
        <p className="">No groups available.</p>
      )}
    </div>
  )
}

export default MyGroupsCard
