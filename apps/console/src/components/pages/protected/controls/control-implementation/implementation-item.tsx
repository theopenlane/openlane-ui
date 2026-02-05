'use client'

import React from 'react'
import { MoreHorizontal } from 'lucide-react'
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
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span />
        <Menu
          closeOnSelect
          trigger={
            <Button type="button" variant="secondary" className="h-8 px-2">
              <span className="sr-only">Implementation actions</span>
              <MoreHorizontal size={16} />
            </Button>
          }
          content={(close) => (
            <>
              <button
                type="button"
                className="text-left text-sm"
                onClick={() => {
                  onMarkVerified(node.id)
                  close()
                }}
                disabled={isMenuDisabled || Boolean(node.verified)}
              >
                Mark Verified
              </button>
              <button
                type="button"
                className="text-left text-sm"
                onClick={() => {
                  onEdit(node)
                  close()
                }}
                disabled={isMenuDisabled}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-left text-sm"
                onClick={() => {
                  setAssociationsOpen(true)
                  close()
                }}
                disabled={isMenuDisabled}
              >
                Set Associations
              </button>
              <button
                type="button"
                className="text-left text-sm text-destructive"
                onClick={() => {
                  onDelete(node.id)
                  close()
                }}
                disabled={isMenuDisabled}
              >
                Delete
              </button>
            </>
          )}
        />
      </div>
      <ControlImplementationCard obj={node} />
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
