'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment } from '@repo/codegen/src/schema'
import { ChevronsDownUp, ChevronsUpDown, CirclePlus, Settings2 } from 'lucide-react'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'

import { Loading } from '@/components/shared/loading/loading'
import { ControlObjectiveCard } from './control-objective-card'

const ControlObjectivePage = () => {
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined
  const [showCreateSheet, setShowCreateSheet] = useState(false)

  const { data, isLoading } = useGetAllControlObjectives({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
  })

  const edges = data?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  if (isLoading) {
    return <Loading />
  }

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
      <CreateControlObjectiveSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
      <div className="flex justify-between items-center">
        <PageHeading heading="Control Objectives" />
        <div className="flex gap-2.5 items-center">
          <Button className="h-8 !px-2" variant="outline" onClick={() => null} icon={<ChevronsDownUp />} iconPosition="left">
            Collapse all
          </Button>
          <Button className="h-8 !px-2" variant="outline" onClick={() => null} icon={<ChevronsUpDown />} iconPosition="left">
            Expand all
          </Button>
          <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create Objective
          </Button>
        </div>
      </div>
      <div className="space-y-4 mt-6">
        {edges.map((edge) => (
          <ControlObjectiveCard key={edge.node.id} obj={edge.node} />
        ))}
      </div>
    </div>
  )
}

export default ControlObjectivePage
