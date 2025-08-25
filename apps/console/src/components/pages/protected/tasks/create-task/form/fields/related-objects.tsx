'use client'

import React from 'react'
import Link from 'next/link'
import { BookText, Info, PencilLine, SlidersHorizontal } from 'lucide-react'
import { TaskQuery } from '@repo/codegen/src/schema'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import ObjectsChip from '@/components/shared/objects-chip/objects-chip'

type RelatedObjectsProps = {
  taskData: TaskQuery['task'] | undefined
}

const RelatedObjects: React.FC<RelatedObjectsProps> = ({ taskData }) => {
  const handleRelatedObjects = () => {
    const itemsDictionary: Record<string, { id: string; value: string; controlId?: string; details?: string | null }> = {
      ...taskData?.controlObjectives?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'Control objective' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.controls?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.refCode || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Control', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),

      ...taskData?.subcontrols?.edges?.reduce(
        (acc: Record<string, { id: string; value: string; controlId?: string; details?: string | null }>, item) => {
          const key = item?.node?.refCode || item?.node?.displayID
          const id = item?.node?.id
          const controlId = item?.node?.controlID
          const details = item?.node?.description
          if (key && id) {
            acc[key] = { id, value: 'Subcontrol', controlId, details: details }
          }
          return acc
        },
        {} as Record<string, { id: string; value: string; controlId?: string; details?: string | null }>,
      ),

      ...taskData?.programs?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Program', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),

      ...taskData?.procedures?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.details
          if (key && id) acc[key] = { id, value: 'Procedure', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),

      ...taskData?.internalPolicies?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.details
          if (key && id) acc[key] = { id, value: 'Policy', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),

      ...taskData?.evidence?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Evidence', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),

      ...taskData?.groups?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Group', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),

      ...taskData?.risks?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.details
          if (key && id) acc[key] = { id, value: 'Risk', details: details }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null }>,
      ),
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(itemsDictionary).map(([key, { id, value, controlId, details }]) => {
          const href = getHrefForObjectType(value, {
            id,
            control: controlId ? { id: controlId } : undefined,
          })

          const linkClass = !href ? 'pointer-events-none' : ''

          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger>
                  <Link className={linkClass} href={href} key={key}>
                    <ObjectsChip name={key} objectType={value}></ObjectsChip>
                  </Link>
                  <TooltipContent>
                    <div>
                      <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                        <div className="flex items-center gap-1">
                          <SlidersHorizontal size={12} />
                          <span className="font-medium">Name</span>
                        </div>
                        <span className="cursor-pointer break-words">{key}</span>
                      </div>
                      <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                        <div className="flex items-center gap-1">
                          <Info size={12} />
                          <span className="font-medium">Type</span>
                        </div>
                        <span className="cursor-pointer break-words">{value}</span>
                      </div>
                      <div className="flex flex-col pt-2">
                        <div className="flex items-center gap-1">
                          <PencilLine size={12} />
                          <span className="font-medium">Description</span>
                        </div>
                        <div className="max-w-xs whitespace-normal break-words text-justify">{details ? details : 'No details available'}</div>
                      </div>
                    </div>
                  </TooltipContent>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <BookText height={16} width={16} className="text-accent-secondary" />
      <p className="text-sm w-[120px]">Related Objects</p>
      {handleRelatedObjects()}
    </div>
  )
}

export default RelatedObjects
