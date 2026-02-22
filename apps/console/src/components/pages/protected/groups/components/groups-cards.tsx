'use client'

import React from 'react'
import { GlobeIcon, LockIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Group } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'

interface Props {
  groups: Group[]
  isError: boolean
}

const MyGroupsCard = ({ groups, isError }: Props) => {
  const { replace } = useSmartRouter()

  const handleRowClick = (group: Group) => {
    replace({ id: group.id })
  }

  if (isError) {
    return <p className="text-red-500">Error loading groups</p>
  }

  return (
    <div className="flex flex-wrap gap-7">
      {groups.length > 0 ? (
        groups.map((group) => (
          <Card key={group.id} className="w-full max-w-md cursor-pointer" onClick={() => handleRowClick(group as Group)}>
            <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
              <h3 className="font-semibold truncate">{group.displayName || group.name}</h3>
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
                    <TagChip key={index} tag={tag} />
                  ))}
                </div>
              )}
              {group.members && (group.members?.edges?.length || 0) > 0 ? (
                <div className="flex items-center gap-2">
                  {group.members.edges?.slice(0, 9).map((member, index: number) => <Avatar key={index} className="h-8 w-8" entity={member?.node?.user} />)}

                  {(group.members?.edges?.length || 0) > 9 && (
                    <TooltipProvider disableHoverableContent={false}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-8 w-8 flex items-center justify-center text-sm rounded-full bg-muted text-muted-foreground border">+{(group.members?.edges?.length as number) - 9}</div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-sm max-h-[300px] overflow-y-auto" avoidCollisions={false}>
                          <div className="flex flex-col gap-1">
                            {group.members?.edges?.slice(9).map((edge, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 border-b h-11">
                                <Avatar className="h-8 w-8" entity={edge?.node?.user} />
                                <p>{edge?.node?.user?.displayName}</p>
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
