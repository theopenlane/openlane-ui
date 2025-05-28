'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlImplementations } from '@/lib/graphql-hooks/control-implementations'
import { ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ArrowRight, ChevronRight, ChevronsDownUp, ChevronsUpDown, CirclePlus, Pencil, Settings2 } from 'lucide-react'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'

import { Loading } from '@/components/shared/loading/loading'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion'
import CreateControlImplementationSheet from '../control-implementation/create-control-implementation-sheet'
import { ControlImplementationCard } from '../control-implementation/control-implementation-card'

const ControlImplementationPage = () => {
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [existingIds, setExistingIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [editData, setEditData] = useState<ControlImplementationFieldsFragment | null>(null)

  const { data, isLoading } = useGetAllControlImplementations({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
  })

  const edges = data?.controlImplementations?.edges?.filter((edge): edge is { node: ControlImplementationFieldsFragment } => !!edge?.node)

  const expandFirstImplementation = (ids: string[]) => {
    if (ids.length > 0) {
      setExpandedItems([ids[0]])
    }
  }

  const detectAndExpandNewImplementations = (currentIds: string[], existingIds: string[]) => {
    const newIds = currentIds.filter((id) => !existingIds.includes(id))
    if (newIds.length > 0) {
      setExistingIds(currentIds)
      setExpandedItems((prev) => [...prev, ...newIds])
    }
  }

  const handleControlImplementationsUpdate = useCallback(() => {
    if (!edges?.length) return

    const currentIds = edges.map((e) => e.node.id)

    if (!isInitialized) {
      setExistingIds(currentIds)
      expandFirstImplementation(currentIds)
      setIsInitialized(true)
      return
    }

    detectAndExpandNewImplementations(currentIds, existingIds)
  }, [edges, existingIds, isInitialized])

  useEffect(() => {
    handleControlImplementationsUpdate()
  }, [handleControlImplementationsUpdate])

  if (isLoading) {
    return <Loading />
  }

  if (!edges?.length) {
    return (
      <>
        <CreateControlImplementationSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-300">
          <Settings2 className="w-20 h-20 mb-4 text-border" strokeWidth={1} />
          <p className="mb-2 text-sm">No Implementation found for this Control.</p>
          <div className="text-blue-500 flex items-center gap-1 cursor-pointer">
            <p onClick={() => setShowCreateSheet(true)} className="text-blue-500">
              Create a new one
            </p>{' '}
            <ArrowRight className="mt-0.5" size={16} />
          </div>
        </div>
      </>
    )
  }

  return (
    <div>
      <CreateControlImplementationSheet
        open={showCreateSheet}
        onOpenChange={(open) => {
          setShowCreateSheet(open)
          if (!open) setEditData(null)
        }}
        editData={editData}
      />
      <div className="flex justify-between items-center">
        <PageHeading heading="Control Implementations" />
        <div className="flex gap-2.5 items-center">
          <Button className="h-8 !px-2" variant="outline" onClick={() => setExpandedItems([])} icon={<ChevronsDownUp />} iconPosition="left">
            Collapse all
          </Button>
          <Button className="h-8 !px-2" variant="outline" onClick={() => setExpandedItems(edges.map((e) => e.node.id))} icon={<ChevronsUpDown />} iconPosition="left">
            Expand all
          </Button>
          <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create Implementation
          </Button>
        </div>
      </div>
      <div className="space-y-4 mt-6">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full mt-6">
          {edges.map((edge, i) => (
            <AccordionItem key={edge.node.id} value={edge.node.id}>
              <div className="flex justify-between items-center my-2">
                <AccordionTrigger className="group flex items-center px-2 py-2 bg-background">
                  <ChevronRight size={22} className="mr-2 text-brand transition-transform group-data-[state=open]:rotate-90" />
                  <span className="text-base font-medium ">{`Implementation ${i + 1}`}</span>
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
                <ControlImplementationCard obj={edge.node} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

export default ControlImplementationPage
