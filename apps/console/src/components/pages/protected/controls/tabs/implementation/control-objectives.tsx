'use client'

import React, { useState } from 'react'
import { useDeleteControlObjective, useUpdateControlObjective } from '@/lib/graphql-hooks/control-objectives'
import { ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import CreateControlObjectiveSheet from './control-objectives-components/create-control-objective-sheet'
import { ObjectiveItem } from './control-objectives-components/objective-item'

type ControlObjectivesProps = {
  edges: { node: ControlObjectiveFieldsFragment }[] | undefined
}

const ControlObjectives: React.FC<ControlObjectivesProps> = ({ edges }) => {
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [editData, setEditData] = useState<ControlObjectiveFieldsFragment | null>(null)
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateObjective } = useUpdateControlObjective()
  const { mutateAsync: deleteObjective } = useDeleteControlObjective()

  const handleDelete = async (id: string) => {
    try {
      await deleteObjective({ deleteControlObjectiveId: id })
      successNotification({ title: 'Control Objective deleted' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

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

  if (!edges?.length) {
    return null
  }

  return (
    <div className="space-y-6">
      <CreateControlObjectiveSheet
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
            <h2 className="text-lg font-semibold">Control Objectives</h2>
          </div>
        </div>
        {edges.map(({ node }) => (
          <ObjectiveItem
            key={node.id}
            node={node}
            onEdit={(selected) => {
              setEditData(selected)
              setShowCreateSheet(true)
            }}
            onUnarchive={handleUnarchive}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}

export default ControlObjectives
