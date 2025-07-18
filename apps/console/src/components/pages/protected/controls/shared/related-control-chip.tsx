'use client'

import React from 'react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { ChevronsLeftRightEllipsis, PencilLine } from 'lucide-react'
import { MappingIconMapper } from '@/components/shared/enum-mapper/map-control-enum'
import { MappedControlMappingType } from '@repo/codegen/src/schema'

type Props = {
  refCode: string
  href: string
  mappingType?: MappedControlMappingType
  relation?: string | null
}

export const RelatedControlChip: React.FC<Props> = ({ refCode, href, mappingType, relation }) => {
  const tooltipDisabled = !relation && !mappingType

  const chip = (
    <Link href={href} onClick={(e) => e.stopPropagation()}>
      <span className="text-xs border rounded-full cursor-pointer hover:text-brand px-2.5 py-0.5">{refCode}</span>
    </Link>
  )

  if (tooltipDisabled) {
    return chip
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex flex-col gap-1">
            {mappingType && (
              <div className="flex gap-1 items-center border-b">
                <ChevronsLeftRightEllipsis size={12} />
                <span>Mapping type</span>
                <div className={`ml-4 flex w-2.5 h-2.5 justify-center items-center ${mappingType === MappedControlMappingType.SUPERSET ? 'h-5 w-5' : 'h-2.5 w-2.5'}`}>
                  {MappingIconMapper[mappingType]}
                </div>
                <span className="capitalize">{mappingType.toLowerCase()}</span>
              </div>
            )}
            <div className="flex gap-1 items-center">
              <PencilLine size={12} />
              <span>Relation Description</span>
            </div>
            <span className="line-clamp-4">{relation}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
