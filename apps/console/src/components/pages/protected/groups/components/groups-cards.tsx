'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { GlobeIcon, LockIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Group, User } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

interface Props {
  groups: Group[]
  isError: boolean
}

const MyGroupsCard = ({ groups, isError }: Props) => {
  const { setSelectedGroup } = useGroupsStore()

  const handleRowClick = (group: Group) => {
    setSelectedGroup(group.id)
  }

  if (isError) {
    return <p className="text-red-500">Error loading groups</p>
  }

  return (
    <div className="mt-5 flex flex-wrap gap-7">
      {groups.length > 0 ? (
        groups.map((group) => (
          <Card key={group.id} className="w-full max-w-md cursor-pointer" onClick={() => handleRowClick(group as Group)}>
            <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
              <h3 className="font-semibold truncate">{group.name}</h3>
              <div className="flex gap-2  items-center">
                {group.isManaged && <p className="text-text-light text-normal">Prebuilt</p>}
                {group.setting?.visibility === 'PUBLIC' ? <GlobeIcon className="h-5 w-5 " /> : <LockIcon className="h-5 w-5 " />}
              </div>
            </div>
            <div className="py-3 px-4 pb-5">
              <p className="text-sm mb-3 line-clamp-3 overflow-hidden text-ellipsis">{group.description}</p>{' '}
              {group?.tags && group?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {group.members && group.members.length > 0 ? (
                <div className="flex items-center gap-2">
                  {group.members.slice(0, 9).map((member: any, index: number) => (
                    <Avatar key={index} className="h-8 w-8" entity={member.user as User} />
                  ))}

                  {group.members.length > 9 && (
                    <TooltipProvider disableHoverableContent={false}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-8 w-8 flex items-center justify-center text-sm rounded-full bg-muted text-muted-foreground border">+{group.members.length - 9}</div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-sm max-h-[300px] overflow-y-auto" avoidCollisions={false}>
                          <div className="flex flex-col gap-1">
                            {group.members.slice(9).map((member: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 border-b h-11">
                                <Avatar className="h-8 w-8" entity={member.user as User} />
                                <p>{member?.user?.firstName + ' ' + member?.user?.lastName}</p>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
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
