'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useDeleteControlImplementation, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/tabs/implementation/control-implementation-components/create-control-implementation-sheet'
import { useNotification } from '@/hooks/useNotification'
import { ImplementationItem } from '@/components/pages/protected/controls/tabs/implementation/control-implementation-components/implementation-item'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type ControlImplementationsProps = {
  edges: { node: ControlImplementationFieldsFragment }[] | undefined
}

const ControlImplementations: React.FC<ControlImplementationsProps> = ({ edges }) => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [editData, setEditData] = useState<ControlImplementationFieldsFragment | null>(null)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateImplementation, isPending } = useUpdateControlImplementation()
  const { mutateAsync: deleteImplementation } = useDeleteControlImplementation()

  const handleMarkVerified = async (implementationId: string, verified: boolean) => {
    try {
      await updateImplementation({
        updateControlImplementationId: implementationId,
        input: { verified },
      })
      successNotification({ title: verified ? 'Marked as verified' : 'Marked as not verified' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDelete = async (node: ControlImplementationFieldsFragment) => {
    const totalLinks = (node.controls?.edges?.length ?? 0) + (node.subcontrols?.edges?.length ?? 0)
    const shouldUnlink = totalLinks > 1

    try {
      if (shouldUnlink) {
        const input = subcontrolId ? { removeSubcontrolIDs: [subcontrolId] } : { removeControlIDs: [id] }
        await updateImplementation({ updateControlImplementationId: node.id, input })
        successNotification({ title: 'Control Implementation unlinked' })
      } else {
        await deleteImplementation({ deleteControlImplementationId: node.id })
        successNotification({ title: 'Control Implementation deleted' })
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <div className="space-y-6">
      <CreateControlImplementationSheet
        open={showCreateSheet}
        onOpenChange={(open) => {
          setShowCreateSheet(open)
          if (!open) setEditData(null)
        }}
        editData={editData}
      />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold">Implementations</h2>
          </div>
        </div>
        {edges && edges?.length > 0 ? (
          edges?.map((edge) => (
            <ImplementationItem
              key={edge.node.id}
              node={edge.node}
              onEdit={(node) => {
                setEditData(node)
                setShowCreateSheet(true)
              }}
              onMarkVerified={handleMarkVerified}
              onDelete={handleDelete}
              isUpdating={isPending}
            />
          ))
        ) : (
          <div className="text-base text-muted-foreground">No implementations found.</div>
        )}
      </div>
    </div>
  )
}

export default ControlImplementations
