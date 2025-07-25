'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { BookText } from 'lucide-react'
import { TaskQuery } from '@repo/codegen/src/schema'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

type RelatedObjectsProps = {
  taskData: TaskQuery['task'] | undefined
}

const RelatedObjects: React.FC<RelatedObjectsProps> = ({ taskData }) => {
  const handleRelatedObjects = () => {
    const itemsDictionary: Record<string, { id: string; value: string; controlId?: string }> = {
      ...taskData?.controlObjectives?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'controlObjectives' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.controls?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.refCode
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'controls' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.subcontrols?.edges?.reduce(
        (acc: Record<string, { id: string; value: string; controlId?: string }>, item) => {
          const key = item?.node?.refCode
          const id = item?.node?.id
          const controlId = item?.node?.controlID
          if (key && id) {
            acc[key] = { id, value: 'subcontrols', controlId }
          }
          return acc
        },
        {} as Record<string, { id: string; value: string; controlId?: string }>,
      ),

      ...taskData?.programs?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'programs' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.procedures?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'procedures' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.internalPolicies?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'policies' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.evidence?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'evidence' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.groups?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.displayID
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'groups' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),

      ...taskData?.risks?.edges?.reduce(
        (acc, item) => {
          const key = item?.node?.name
          const id = item?.node?.id
          if (key && id) acc[key] = { id, value: 'risks' }
          return acc
        },
        {} as Record<string, { id: string; value: string }>,
      ),
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(itemsDictionary).map(([key, { id, value, controlId }]) => {
          const href = getHrefForObjectType(value, {
            id,
            control: controlId ? { id: controlId } : undefined,
          })

          const linkClass = !href ? 'pointer-events-none' : ''

          return (
            <Link className={linkClass} href={href} key={key}>
              <Badge variant="outline">{key}</Badge>
            </Link>
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
