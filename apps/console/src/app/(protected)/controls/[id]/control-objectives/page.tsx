'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment } from '@repo/codegen/src/schema'
import { Settings2 } from 'lucide-react'
import Link from 'next/link'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'

const Page = () => {
  const params = useParams()
  const id = params?.id as string
  const [showCreateSheet, setShowCreateSheet] = useState(false)

  const { data } = useGetAllControlObjectives({
    hasControlsWith: [{ id }],
  })

  const edges = data?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  if (!edges?.length) {
    return (
      <>
        <CreateControlObjectiveSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-300">
          <Settings2 className="w-20 h-20 mb-4 text-border" strokeWidth={1} />
          <p className="mb-2 text-sm">No Objective found for this Control.</p>
          <p onClick={() => setShowCreateSheet(true)} className="cursor-pointer text-blue-500 text-sm hover:underline hover:text-blue-400">
            Create a new one →
          </p>
        </div>
      </>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Control Objectives</h1>
      <ul className="space-y-2">
        {edges.map((edge) => (
          <li key={edge.node.id}>{edge.node.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default Page
