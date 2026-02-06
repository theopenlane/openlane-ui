'use client'

import React from 'react'
import { CheckCircle2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ControlImplementationCard } from './control-implementation-card'
import { canEdit } from '@/lib/authz/utils'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import Menu from '@/components/shared/menu/menu'
import { Button } from '@repo/ui/button'
import { LinkControlsModal } from './link-controls-modal'

type Props = {
  node: ControlImplementationFieldsFragment
  onEdit: (node: ControlImplementationFieldsFragment) => void
  onMarkVerified: (id: string) => void
  onDelete: (id: string) => void
  isUpdating?: boolean
}

export const ImplementationItem: React.FC<Props> = ({ node, onEdit, onMarkVerified, onDelete, isUpdating }) => {
  const { data: permission, isLoading: permLoading } = useAccountRoles(ObjectEnum.CONTROL_IMPLEMENTATION, node.id)
  const isEditAllowed = canEdit(permission?.roles)
  const [associationsOpen, setAssociationsOpen] = React.useState(false)
  const isMenuDisabled = !isEditAllowed || isUpdating || permLoading

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Menu
          closeOnSelect
          trigger={
            <Button type="button" variant="secondary" className="h-8 px-2" aria-label="Implementation actions">
              <span className="sr-only">Implementation actions</span>
              <MoreHorizontal size={16} />
            </Button>
          }
          content={(close) => (
            <>
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => {
                  onMarkVerified(node.id)
                  close()
                }}
                disabled={isMenuDisabled || Boolean(node.verified)}
              >
                <CheckCircle2 size={16} />
                Mark Verified
              </button>
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => {
                  onEdit(node)
                  close()
                }}
                disabled={isMenuDisabled}
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                className="flex items-center gap-2 text-destructive"
                onClick={() => {
                  onDelete(node.id)
                  close()
                }}
                disabled={isMenuDisabled}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          )}
        />
      </div>
      <ControlImplementationCard
        obj={node}
        actions={
          <Button type="button" className="h-8" onClick={() => setAssociationsOpen(true)} disabled={isMenuDisabled} aria-label="Set associations">
            Set Associations
          </Button>
        }
      />
      <LinkControlsModal
        updateControlImplementationId={node.id}
        hideTrigger
        open={associationsOpen}
        onOpenChange={setAssociationsOpen}
        initialData={{
          controlIDs: node.controls?.edges?.flatMap((edge) => edge?.node?.id || []),
          subcontrolIDs: node.subcontrols?.edges?.flatMap((edge) => edge?.node?.id || []),
        }}
      />
    </div>
  )
}
