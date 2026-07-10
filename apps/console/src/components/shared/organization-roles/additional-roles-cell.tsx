'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

const MAX_VISIBLE = 2

type AdditionalRolesCellProps = {
  roles?: string[] | null
}

export const AdditionalRolesCell = ({ roles }: AdditionalRolesCellProps) => {
  if (!roles || roles.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = roles.slice(0, MAX_VISIBLE)
  const overflow = roles.slice(MAX_VISIBLE)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((name) => (
        <Badge key={name} variant="select">
          {name}
        </Badge>
      ))}
      {overflow.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="select" className="cursor-help">
                +{overflow.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{overflow.join(', ')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
