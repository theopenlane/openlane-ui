'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useGetAllControlObjectives, useUpdateControlObjective } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { ArrowRight, ChevronsDownUp, CirclePlus, List, Settings2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { Accordion } from '@radix-ui/react-accordion'
import { Checkbox } from '@repo/ui/checkbox'
import { useNotification } from '@/hooks/useNotification'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import { ObjectiveItem } from '@/components/pages/protected/controls/control-objectives/objective-item'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const ObjectivesTab: React.FC = () => {
  const searchParams = useSearchParams()
  const { id } = useParams<{ id: string }>()
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [existingIds, setExistingIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [editData, setEditData] = useState<ControlObjectiveFieldsFragment | null>(null)
  const [archivedChecked, setArchivedChecked] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const { data: orgPermission } = useOrganizationRoles()
  const createAllowed = canCreate(orgPermission?.roles, AccessEnum.CanCreateControlObjective)

  const { data, isLoading } = useGetAllControlObjectives({
    hasControlsWith: [{ id }],
    ...(archivedChecked ? {} : { statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED }),
  })

  const edges = data?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  const { mutateAsync: updateObjective } = useUpdateControlObjective()

  const toggleAll = () => {
    if (!edges) return

    const allIds = edges.map((edge) => edge.node.id)
    const hasAllExpanded = allIds.every((itemId) => expandedItems.includes(itemId))

    setExpandedItems(hasAllExpanded ? [] : allIds)
  }

  const expandFirstObjective = (ids: string[]) => {
    if (ids.length > 0) {
      setExpandedItems([ids[0]])
    }
  }

  const detectAndExpandNewObjectives = (currentIds: string[], knownIds: string[]) => {
    const newIds = currentIds.filter((itemId) => !knownIds.includes(itemId))
    if (newIds.length > 0) {
      setExistingIds(currentIds)
      setExpandedItems((prev) => [...prev, ...newIds])
    }
  }

  const handleControlObjectivesUpdate = useCallback(() => {
    if (!edges?.length) return

    const currentIds = edges.map((edge) => edge.node.id)

    if (!isInitialized) {
      setExistingIds(currentIds)
      expandFirstObjective(currentIds)
      setIsInitialized(true)
      return
    }

    detectAndExpandNewObjectives(currentIds, existingIds)
  }, [edges, existingIds, isInitialized])

  const handleUnarchive = async (node: ControlObjectiveFieldsFragment) => {
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
    const shouldOpen = createAllowed && searchParams.get('create') === 'true'
    if (shouldOpen) {
      setShowCreateSheet(true)
    }
  }, [createAllowed, searchParams])

  if (isLoading) {
    return <Loading />
  }

  if (!edges?.length) {
    return (
      <>
        <CreateControlObjectiveSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold">Control Objectives</h3>
          {createAllowed && (
            <Button variant="secondary" className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
              Create
            </Button>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Checkbox checked={archivedChecked} onCheckedChange={(checked) => setArchivedChecked(!!checked)} />
            <p>Show archived</p>
          </div>
          <Button type="button" className="h-8 !px-2" variant="secondary" onClick={toggleAll}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-300">
          <Settings2 className="w-20 h-20 mb-4 text-border" strokeWidth={1} />
          <p className="mb-2 text-sm">No Objective found for this Control.</p>
          {createAllowed && (
            <div className="text-blue-500 flex items-center gap-1 cursor-pointer">
              <p onClick={() => setShowCreateSheet(true)} className="text-blue-500">
                Create a new one
              </p>{' '}
              <ArrowRight className="mt-0.5" size={16} />
            </div>
          )}
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
        <h3 className="text-base font-semibold">Control Objectives</h3>
        {createAllowed && (
          <Button className="h-8 !px-2" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create
          </Button>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 items-center">
          <Checkbox checked={archivedChecked} onCheckedChange={(checked) => setArchivedChecked(!!checked)} /> <p>Show archived</p>
        </div>
        <Button type="button" className="h-8 !px-2" variant="secondary" onClick={toggleAll}>
          <div className="flex">
            <List size={16} />
            <ChevronsDownUp size={16} />
          </div>
        </Button>
      </div>
      <div className="space-y-4 mt-6">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full mt-6">
          {edges.map(({ node }) => (
            <ObjectiveItem
              key={node.id}
              node={node}
              onEdit={(selected) => {
                setEditData(selected)
                setShowCreateSheet(true)
              }}
              onUnarchive={handleUnarchive}
            />
          ))}
        </Accordion>
      </div>
    </div>
  )
}

export default ObjectivesTab
