'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { useGetControlImplementationById, useUpdateControlImplementation, useDeleteControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { ControlImplementationCard } from './control-implementation-card'
import { LinkControlsModal } from './link-controls-modal'
import CreateControlImplementationSheet from './create-control-implementation-sheet'
import { type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { canEdit } from '@/lib/authz/utils'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Loading } from '@/components/shared/loading/loading'

type Props = {
  queryParamKey?: string
  entityId?: string | null
  onClose?: () => void
}

const ControlImplementationDetailsSheet: React.FC<Props> = ({ queryParamKey = 'controlImplementationId', entityId: entityIdProp, onClose: onCloseProp }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityIdFromUrl = searchParams.get(queryParamKey)
  const entityId = entityIdProp !== undefined ? entityIdProp : entityIdFromUrl

  const { data: node, isLoading } = useGetControlImplementationById(entityId)
  const { mutateAsync: updateImplementation, isPending: isUpdating } = useUpdateControlImplementation()
  const { mutateAsync: deleteImplementation } = useDeleteControlImplementation()
  const { successNotification, errorNotification } = useNotification()

  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL_IMPLEMENTATION, entityId ?? undefined)
  const isEditAllowed = canEdit(permission?.roles)

  const [showEditSheet, setShowEditSheet] = useState(false)
  const [associationsOpen, setAssociationsOpen] = useState(false)

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const handleMarkVerified = async () => {
    if (!node) return
    try {
      await updateImplementation({
        updateControlImplementationId: node.id,
        input: { verified: !node.verified },
      })
      successNotification({ title: node.verified ? 'Marked as not verified' : 'Marked as verified' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    if (!node) return
    try {
      await deleteImplementation({ deleteControlImplementationId: node.id })
      successNotification({ title: 'Control Implementation deleted' })
      handleClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <>
      <Sheet open={!!entityId} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="flex flex-col gap-4 overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">Control Implementation</SheetTitle>
          </SheetHeader>
          {isLoading ? (
            <Loading />
          ) : node ? (
            <>
              <ControlImplementationCard
                obj={node}
                actions={
                  <Button type="button" className="h-8" onClick={() => setAssociationsOpen(true)} disabled={!isEditAllowed || isUpdating} aria-label="Link controls">
                    Link Controls
                  </Button>
                }
              />
              {isEditAllowed && (
                <div className="flex items-center gap-2 justify-end">
                  <Button type="button" variant="secondary" className="h-8 px-3" onClick={handleMarkVerified} disabled={isUpdating}>
                    <CheckCircle2 size={16} className="mr-1" />
                    {node.verified ? 'Mark Not Verified' : 'Mark Verified'}
                  </Button>
                  <Button type="button" variant="secondary" className="h-8 px-3" onClick={() => setShowEditSheet(true)} disabled={isUpdating}>
                    <Pencil size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" className="h-8 px-3" onClick={handleDelete} disabled={isUpdating}>
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {node && (
        <>
          <CreateControlImplementationSheet open={showEditSheet} onOpenChange={setShowEditSheet} editData={node as ControlImplementationFieldsFragment} />
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
        </>
      )}
    </>
  )
}

export default ControlImplementationDetailsSheet
