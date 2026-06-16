'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

export const RoleUnavailablePlaceholder = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="cursor-help">
            Role unavailable
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">Assigned roles can&apos;t be displayed yet — the backend has no endpoint to read a member&apos;s or group&apos;s functional roles.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
