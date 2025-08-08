'use client'

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlImplementations, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementations'
import { ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ArrowRight, Check, ChevronRight, ChevronsDownUp, CirclePlus, List, Pencil, Settings2 } from 'lucide-react'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { ControlImplementationCard } from './control-implementation-card'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion'
import CreateControlImplementationSheet from './create-control-implementation-sheet'
import { useNotification } from '@/hooks/useNotification'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const ControlImplementationPage = () => {
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [existingIds, setExistingIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [editData, setEditData] = useState<ControlImplementationFieldsFragment | null>(null)

  const { successNotification, errorNotification } = useNotification()
  const { data, isLoading } = useGetAllControlImplementations({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
  })

  const { setCrumbs } = useContext(BreadcrumbContext)
  const isControl = !subcontrolId && !!id
  const isSubControl = !!subcontrolId
  const { data: controlData, isLoading: isControlLoading } = useGetControlById(isControl ? (id as string) : null)
  const { data: subcontrolData, isLoading: isSubcontrolLoading } = useGetSubcontrolById(isSubControl ? (subcontrolId as string) : null)

  const { mutateAsync: updateImplementation, isPending } = useUpdateControlImplementation()
  const edges = data?.controlImplementations?.edges?.filter((edge): edge is { node: ControlImplementationFieldsFragment } => !!edge?.node)

  const toggleAll = () => {
    if (!edges) return

    const allIds = edges.map((edge) => edge.node.id)
    const hasAllExpanded = allIds.every((id) => expandedItems.includes(id))

    setExpandedItems(hasAllExpanded ? [] : allIds)
  }

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

  const handleImplementationsUpdate = useCallback(() => {
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

  const handleMarkVerified = async (id: string) => {
    try {
      await updateImplementation({
        updateControlImplementationId: id,
        input: { verified: true },
      })
      successNotification({ title: 'Marked as verified' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    handleImplementationsUpdate()
  }, [handleImplementationsUpdate])

  useEffect(() => {
    if (controlData) {
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Controls', href: '/controls' },
        { label: controlData?.control?.refCode, isLoading: isControlLoading, href: `/controls/${id}` },
        { label: 'Control Implementation' },
      ])
    }
    if (subcontrolData) {
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Controls', href: '/controls' },
        { label: subcontrolData?.subcontrol?.refCode, isLoading: isSubcontrolLoading, href: `/controls/${id}/${subcontrolId}` },
        { label: 'Control Implementation' },
      ])
    }
  }, [setCrumbs, controlData, subcontrolData, id, isControlLoading, isSubcontrolLoading, subcontrolId])

  if (isLoading) {
    return <Loading />
  }

  if (!edges?.length) {
    return (
      <>
        <CreateControlImplementationSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-300">
          <Settings2 className="w-20 h-20 mb-4 text-border" strokeWidth={1} />
          <p className="mb-2 text-sm">No Implementations found for this Control.</p>
          <div className="text-blue-500 flex items-center gap-1 cursor-pointer">
            <p onClick={() => setShowCreateSheet(true)} className="text-blue-500">
              Create a new one
            </p>
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
          <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAll}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
          <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create
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

                <div className="flex gap-2">
                  <Button className="h-8 !px-2" icon={<Check />} iconPosition="left" onClick={() => handleMarkVerified(edge.node.id)} disabled={isPending || !!edge.node.verified}>
                    {edge.node.verified ? 'Verified' : 'Mark verified'}
                  </Button>
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
