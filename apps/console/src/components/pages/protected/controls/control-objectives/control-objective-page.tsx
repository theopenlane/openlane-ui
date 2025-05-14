'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment } from '@repo/codegen/src/schema'
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, CirclePlus, Pencil, Settings2 } from 'lucide-react'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'

import { Loading } from '@/components/shared/loading/loading'
import { ControlObjectiveCard } from './control-objective-card'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion'

const ControlObjectivePage = () => {
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [editData, setEditData] = useState<ControlObjectiveFieldsFragment | null>(null)

  const { data, isLoading } = useGetAllControlObjectives({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
  })

  const edges = data?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  useEffect(() => {
    if (edges?.length && expandedItems.length === 0 && !isInitialized) {
      setExpandedItems([edges[0].node.id])
      setIsInitialized(true)
    }
  }, [edges, expandedItems.length, isInitialized])

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
      <CreateControlObjectiveSheet
        open={showCreateSheet}
        onOpenChange={(open) => {
          setShowCreateSheet(open)
          if (!open) setEditData(null)
        }}
        editData={editData}
      />
      <div className="flex justify-between items-center">
        <PageHeading heading="Control Objectives" />
        <div className="flex gap-2.5 items-center">
          <Button className="h-8 !px-2" variant="outline" onClick={() => setExpandedItems([])} icon={<ChevronsDownUp />} iconPosition="left">
            Collapse all
          </Button>
          <Button className="h-8 !px-2" variant="outline" onClick={() => setExpandedItems(edges.map((e) => e.node.id))} icon={<ChevronsUpDown />} iconPosition="left">
            Expand all
          </Button>
          <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create Objective
          </Button>
        </div>
      </div>
      <div className="space-y-4 mt-6">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full mt-6">
          {edges.map((edge) => (
            <AccordionItem key={edge.node.id} value={edge.node.id}>
              <div className="flex justify-between items-center my-2">
                <AccordionTrigger className="group flex items-center px-2 py-2 bg-background">
                  <ChevronRight size={22} className="mr-2 text-brand transition-transform group-data-[state=open]:rotate-90" />
                  <span className="text-base font-medium ">{edge.node.name}</span>
                </AccordionTrigger>
                <Button
                  className="h-8 !px-2"
                  variant="outline"
                  icon={<Pencil />}
                  iconPosition="left"
                  onClick={() => {
                    setEditData(edge.node)
                    setShowCreateSheet(true)
                  }}
                >
                  Edit
                </Button>
              </div>
              <AccordionContent>
                <ControlObjectiveCard obj={edge.node} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

export default ControlObjectivePage
