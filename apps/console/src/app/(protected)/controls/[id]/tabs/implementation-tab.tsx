'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useGetAllControlImplementations, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementations'
import { ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ArrowRight, ChevronsDownUp, CirclePlus, List, Settings2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import { Accordion } from '@radix-ui/react-accordion'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/control-implementation/create-control-implementation-sheet'
import { useNotification } from '@/hooks/useNotification'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { ImplementationItem } from '@/components/pages/protected/controls/control-implementation/implementation-item'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const ImplementationTab: React.FC = () => {
  const searchParams = useSearchParams()
  const { id } = useParams<{ id: string }>()
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [existingIds, setExistingIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [editData, setEditData] = useState<ControlImplementationFieldsFragment | null>(null)

  const { successNotification, errorNotification } = useNotification()
  const { data, isLoading } = useGetAllControlImplementations({
    hasControlsWith: [{ id }],
  })

  const { mutateAsync: updateImplementation, isPending } = useUpdateControlImplementation()
  const edges = data?.controlImplementations?.edges?.filter((edge): edge is { node: ControlImplementationFieldsFragment } => !!edge?.node)

  const { data: orgPermission } = useOrganizationRoles()
  const createAllowed = canCreate(orgPermission?.roles, AccessEnum.CanCreateControlImplementation)

  const toggleAll = () => {
    if (!edges) return

    const allIds = edges.map((edge) => edge.node.id)
    const hasAllExpanded = allIds.every((itemId) => expandedItems.includes(itemId))

    setExpandedItems(hasAllExpanded ? [] : allIds)
  }

  const expandFirstImplementation = (ids: string[]) => {
    if (ids.length > 0) {
      setExpandedItems([ids[0]])
    }
  }

  const detectAndExpandNewImplementations = (currentIds: string[], knownIds: string[]) => {
    const newIds = currentIds.filter((itemId) => !knownIds.includes(itemId))
    if (newIds.length > 0) {
      setExistingIds(currentIds)
      setExpandedItems((prev) => [...prev, ...newIds])
    }
  }

  const handleImplementationsUpdate = useCallback(() => {
    if (!edges?.length) return

    const currentIds = edges.map((edge) => edge.node.id)

    if (!isInitialized) {
      setExistingIds(currentIds)
      expandFirstImplementation(currentIds)
      setIsInitialized(true)
      return
    }

    detectAndExpandNewImplementations(currentIds, existingIds)
  }, [edges, existingIds, isInitialized])

  const handleMarkVerified = async (implementationId: string) => {
    try {
      await updateImplementation({
        updateControlImplementationId: implementationId,
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
        <div className="flex gap-2.5 items-center">
          <Button type="button" className="h-8 px-2!" variant="secondary" onClick={toggleAll}>
            <div className="flex">
              <List size={16} />
              <ChevronsDownUp size={16} />
            </div>
          </Button>
        </div>
      </div>
      <div className="space-y-4 mt-6">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full mt-6">
          {edges.map((edge, idx) => (
            <ImplementationItem
              key={edge.node.id}
              idx={idx}
              node={edge.node}
              onEdit={(node) => {
                setEditData(node)
                setShowCreateSheet(true)
              }}
              onMarkVerified={handleMarkVerified}
              isUpdating={isPending}
            />
          ))}
        </Accordion>
      </div>
    </div>
  )
}

export default ImplementationTab
