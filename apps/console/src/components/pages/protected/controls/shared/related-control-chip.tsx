'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { ChevronsLeftRightEllipsis, Pencil, PencilLine, Zap } from 'lucide-react'
import { MappingIconMapper } from '@/components/shared/enum-mapper/map-control-enum'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'

type Props = {
  refCode: string
  href?: string
  mappingType?: MappedControlMappingType
  relation?: string | null
  source?: MappedControlMappingSource
  hidePencil?: boolean
}

export const RelatedControlChip: React.FC<Props> = ({ refCode, href, mappingType, relation, source, hidePencil = false }) => {
  const tooltipDisabled = !relation && !mappingType

  const config = useMemo(() => {
    if (source === MappedControlMappingSource.SUGGESTED) {
      return { icon: <Zap className="mt-0.5" size={10} />, text: 'Mapping created by Openlane' }
    } else {
      return { icon: <Pencil className="mt-0.5" size={10} />, text: 'Added manually by you' }
    }
  }, [source])

  const chipContent = (
    <div
      className={`
      flex gap-1 border rounded-full px-2.5 py-0.5
      ${href ? 'cursor-pointer hover:text-brand' : ''}
    `}
    >
      {hidePencil ? null : config?.icon || null}
      <span className="text-xs">{refCode}</span>
    </div>
  )

  const chip = href ? (
    <Link href={href} onClick={(e) => e.stopPropagation()}>
      {chipContent}
    </Link>
  ) : (
    chipContent
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
            {config?.text && (
              <div className="flex gap-1 items-center border-b">
                <p className="text-xs text-text-informational italic">{config.text}</p>
              </div>
            )}
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
