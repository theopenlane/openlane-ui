'use client'

import React, { useCallback, useEffect, useState, useContext } from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlObjectives, useUpdateControlObjective } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { ArrowRight, ChevronRight, ChevronsDownUp, CirclePlus, List, Pencil, Settings2 } from 'lucide-react'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { ControlObjectiveCard } from './control-objective-card'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion'
import { Checkbox } from '@repo/ui/checkbox'
import { useNotification } from '@/hooks/useNotification'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const ControlObjectivePage = () => {
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [existingIds, setExistingIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [editData, setEditData] = useState<ControlObjectiveFieldsFragment | null>(null)
  const [archivedChecked, setArchivedChecked] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const isControl = !subcontrolId && !!id
  const isSubControl = !!subcontrolId
  const { data: controlData, isLoading: isControlLoading } = useGetControlById(isControl ? (id as string) : null)
  const { data: subcontrolData, isLoading: isSubcontrolLoading } = useGetSubcontrolById(isSubControl ? (subcontrolId as string) : null)

  const { data, isLoading } = useGetAllControlObjectives({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
    ...(archivedChecked ? {} : { statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED }),
  })

  const edges = data?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  const { mutateAsync: updateObjective } = useUpdateControlObjective()

  const toggleAll = () => {
    if (!edges) return

    const allIds = edges.map((edge) => edge.node.id)
    const hasAllExpanded = allIds.every((id) => expandedItems.includes(id))

    setExpandedItems(hasAllExpanded ? [] : allIds)
  }

  const expandFirstObjective = (ids: string[]) => {
    if (ids.length > 0) {
      setExpandedItems([ids[0]])
    }
  }

  const detectAndExpandNewObjectives = (currentIds: string[], existingIds: string[]) => {
    const newIds = currentIds.filter((id) => !existingIds.includes(id))
    if (newIds.length > 0) {
      setExistingIds(currentIds)
      setExpandedItems((prev) => [...prev, ...newIds])
    }
  }

  const handleControlObjectivesUpdate = useCallback(() => {
    if (!edges?.length) return

    const currentIds = edges.map((e) => e.node.id)

    if (!isInitialized) {
      setExistingIds(currentIds)
      expandFirstObjective(currentIds)
      setIsInitialized(true)
      return
    }

    detectAndExpandNewObjectives(currentIds, existingIds)
  }, [edges, existingIds, isInitialized])

  const handleUnarchinve = async (node: ControlObjectiveFieldsFragment) => {
    try {
      await updateObjective({
        input: { status: ControlObjectiveObjectiveStatus.ACTIVE },
        updateControlObjectiveId: node.id,
      })

      successNotification({
        title: 'Objective unarchived',
        description: `${node.name} is now active.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    handleControlObjectivesUpdate()
  }, [handleControlObjectivesUpdate])

  useEffect(() => {
    if (controlData) {
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Controls', href: '/controls' },
        { label: controlData?.control?.refCode, isLoading: isControlLoading, href: `/controls/${id}` },
        { label: 'Control Objective' },
      ])
    }
    if (subcontrolData) {
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Controls', href: '/controls' },
        { label: subcontrolData?.subcontrol?.refCode, isLoading: isSubcontrolLoading, href: `/controls/${id}/${subcontrolId}` },
        { label: 'Control Objective' },
      ])
    }
  }, [setCrumbs, controlData, subcontrolData, id, isControlLoading, isSubcontrolLoading, subcontrolId])

  if (isLoading) {
    return <Loading />
  }

  if (!edges?.length) {
    return (
      <>
        <CreateControlObjectiveSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
        <div className="flex justify-between items-center">
          <PageHeading heading="Control Objectives" />
          <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create
          </Button>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Checkbox checked={archivedChecked} onCheckedChange={(checked) => setArchivedChecked(!!checked)} />
            <p>Show archived</p>
          </div>
          <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAll}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-300">
          <Settings2 className="w-20 h-20 mb-4 text-border" strokeWidth={1} />
          <p className="mb-2 text-sm">No Objective found for this Control.</p>
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
        <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
          Create
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 items-center">
          <Checkbox checked={archivedChecked} onCheckedChange={(checked) => setArchivedChecked(!!checked)} /> <p>Show archived</p>
        </div>
        <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAll}>
          <div className="flex">
            <List size={16} />
            <ChevronsDownUp size={16} />
          </div>
        </Button>
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
                {edge.node.status === ControlObjectiveObjectiveStatus.ARCHIVED ? (
                  <Button
                    className="h-8 !px-2"
                    variant="outline"
                    icon={<Pencil />}
                    iconPosition="left"
                    onClick={() => {
                      handleUnarchinve(edge.node)
                    }}
                  >
                    Unarchive
                  </Button>
                ) : (
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
                )}
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
