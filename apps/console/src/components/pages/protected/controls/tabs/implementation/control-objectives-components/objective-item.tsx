'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Archive, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { canEdit } from '@/lib/authz/utils'
import { ControlObjectiveCard } from './control-objective-card'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import Menu from '@/components/shared/menu/menu'
import { LinkControlsModal } from './link-controls-modal'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type Props = {
  node: ControlObjectiveFieldsFragment
  onEdit: (node: ControlObjectiveFieldsFragment) => void
  onUnarchive: (node: ControlObjectiveFieldsFragment) => void
  onDelete: (id: string) => void
}

export const ObjectiveItem: React.FC<Props> = ({ node, onEdit, onUnarchive, onDelete }) => {
  const { data: permission, isLoading: permLoading } = useAccountRoles(ObjectTypes.CONTROL_OBJECTIVE, node.id)
  const isEditAllowed = canEdit(permission?.roles)
  return (
    <div className="space-y-4">
      {isEditAllowed && !permLoading && (
        <div className="flex items-center justify-end">
          <Menu
            closeOnSelect
            trigger={
              <Button type="button" variant="secondary" className="h-8 px-2" aria-label="Objective actions">
                <span className="sr-only">Objective actions</span>
                <MoreHorizontal size={16} />
              </Button>
            }
            content={(close) => (
              <>
                {node.status === ControlObjectiveObjectiveStatus.ARCHIVED ? (
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => {
                      onUnarchive(node)
                      close()
                    }}
                  >
                    <Archive size={16} />
                    Unarchive
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => {
                      onEdit(node)
                      close()
                    }}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className="flex items-center gap-2 text-destructive"
                  onClick={() => {
                    onDelete(node.id)
                    close()
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          />
        </div>
      )}
      <ControlObjectiveCard obj={node} actions={isEditAllowed && !permLoading ? <LinkControlsModal controlObjectiveData={node} aria-label="Set associations" /> : undefined} />
    </div>
  )
}
