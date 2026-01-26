'use client'

import React from 'react'
import { Info, PencilLine, SlidersHorizontal } from 'lucide-react'
import { TaskQuery } from '@repo/codegen/src/schema'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import ObjectsChip from '@/components/shared/objects-chip/objects-chip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useRouter } from 'next/navigation'
import { useTaskAssociations } from '@/lib/graphql-hooks/tasks'

type RelatedObjectsProps = {
  taskData: TaskQuery['task'] | undefined
}

const RelatedObjects: React.FC<RelatedObjectsProps> = ({ taskData }) => {
  const plateEditorHelper = usePlateEditor()
  const router = useRouter()
  const { data: associationData } = useTaskAssociations(taskData?.id)

  const handleRelatedObjects = () => {
    const itemsDictionary: Record<string, { id: string; value: string; controlId?: string; details?: string | null; kind: string }> = {
      ...associationData?.task?.controlObjectives?.edges?.reduce(
        (acc: Record<string, { id: string; value: string; controlId?: string; details?: string | null; kind: string }>, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.desiredOutcome
          const controlId = item?.node?.controls?.edges?.[0]?.node?.id
          if (key && id) acc[key] = { id, value: 'Control objective', controlId, details: details, kind: 'controlObjectives' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.controls?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.refCode || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Control', details: details, kind: 'controls' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.subcontrols?.edges?.reduce(
        (acc: Record<string, { id: string; value: string; controlId?: string; details?: string | null; kind: string }>, item) => {
          const key = item?.node?.refCode || item?.node?.displayID
          const id = item?.node?.id
          const controlId = item?.node?.controlID
          const details = item?.node?.description
          if (key && id) {
            acc[key] = { id, value: 'Subcontrol', controlId, details: details, kind: 'subcontrols' }
          }
          return acc
        },
        {} as Record<string, { id: string; value: string; controlId?: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.programs?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Program', details: details, kind: 'programs' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.procedures?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.summary
          if (key && id) acc[key] = { id, value: 'Procedure', details: details, kind: 'procedures' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.internalPolicies?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.summary
          if (key && id) acc[key] = { id, value: 'Policy', details: details, kind: 'policies' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.evidence?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Evidence', details: details, kind: 'evidences' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.groups?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.description
          if (key && id) acc[key] = { id, value: 'Group', details: details, kind: 'groups' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...associationData?.task?.risks?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name || item?.node?.displayID
          const id = item?.node?.id
          const details = item?.node?.details
          if (key && id) acc[key] = { id, value: 'Risk', details: details, kind: 'risks' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),

      ...taskData?.tasks?.reduce(
        (acc, item) => {
          const key = item?.title || item?.displayID
          const id = item?.id
          const details = item?.details
          if (key && id) acc[key] = { id, value: 'Task', details: details, kind: 'tasks' }
          return acc
        },
        {} as Record<string, { id: string; value: string; details?: string | null; kind: string }>,
      ),
    }

    const handleNavigate = (href: string) => {
      router.push(href)
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(itemsDictionary).map(([key, { id, value, controlId, details, kind }]) => {
          const href = getHrefForObjectType(kind, {
            id,
            control: controlId ? { id: controlId } : undefined,
          })

          const linkClass = !href || (value === 'Subcontrol' && !controlId) || (value === 'Control objective' && !controlId) ? 'pointer-events-none' : ''
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.preventDefault()} className="bg-unset">
                  <ObjectsChip name={key} objectType={kind} />
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                      <div className="flex items-center gap-1">
                        <SlidersHorizontal size={12} />
                        <span className="font-medium">Name</span>
                      </div>
                      <span className={`text-brand pl-3 cursor-pointer text-primary ${linkClass}`} onClick={() => handleNavigate(href)}>
                        {key}
                      </span>
                    </div>
                    <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                      <div className="flex items-center gap-1">
                        <Info size={12} />
                        <span className="font-medium">Type</span>
                      </div>
                      <span className="cursor-pointer wrap-break-word">{value}</span>
                    </div>
                    <div className="flex flex-col pt-2">
                      <div className="flex items-center gap-1">
                        <PencilLine size={12} />
                        <span className="font-medium">Description</span>
                      </div>
                      <div className="max-w-xs text-justify line-clamp-4">{details ? plateEditorHelper.convertToReadOnly(details) : 'No details available'}</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    )
  }

  return handleRelatedObjects()
}

export default RelatedObjects
