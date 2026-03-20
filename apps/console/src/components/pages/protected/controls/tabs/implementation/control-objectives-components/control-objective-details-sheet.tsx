'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Archive, Pencil, Trash2 } from 'lucide-react'
import { useGetControlObjectiveById, useUpdateControlObjective, useDeleteControlObjective } from '@/lib/graphql-hooks/control-objective'
import { ControlObjectiveCard } from './control-objective-card'
import { LinkControlsModal } from './link-controls-modal'
import CreateControlObjectiveSheet from './create-control-objective-sheet'
import { ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
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

const ControlObjectiveDetailsSheet: React.FC<Props> = ({ queryParamKey = 'controlObjectiveId', entityId: entityIdProp, onClose: onCloseProp }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityIdFromUrl = searchParams.get(queryParamKey)
  const entityId = entityIdProp !== undefined ? entityIdProp : entityIdFromUrl

  const { data: node, isLoading } = useGetControlObjectiveById(entityId)
  const { mutateAsync: updateObjective } = useUpdateControlObjective()
  const { mutateAsync: deleteObjective } = useDeleteControlObjective()
  const { successNotification, errorNotification } = useNotification()

  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL_OBJECTIVE, entityId ?? undefined)
  const isEditAllowed = canEdit(permission?.roles)

  const [showEditSheet, setShowEditSheet] = useState(false)

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const handleArchiveToggle = async () => {
    if (!node) return
    const isArchived = node.status === ControlObjectiveObjectiveStatus.ARCHIVED
    try {
      await updateObjective({
        updateControlObjectiveId: node.id,
        input: { status: isArchived ? ControlObjectiveObjectiveStatus.ACTIVE : ControlObjectiveObjectiveStatus.ARCHIVED },
      })
      successNotification({ title: isArchived ? 'Objective unarchived' : 'Objective archived' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    if (!node) return
    try {
      await deleteObjective({ deleteControlObjectiveId: node.id })
      successNotification({ title: 'Control Objective deleted' })
      handleClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const isArchived = node?.status === ControlObjectiveObjectiveStatus.ARCHIVED

  return (
    <>
      <Sheet open={!!entityId} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="flex flex-col gap-4 overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">Control Objective</SheetTitle>
          </SheetHeader>
          {isLoading ? (
            <Loading />
          ) : node ? (
            <>
              <ControlObjectiveCard obj={node} actions={<LinkControlsModal controlObjectiveData={node} aria-label="Set associations" />} />
              {isEditAllowed && (
                <div className="flex items-center gap-2 justify-end">
                  {isArchived ? (
                    <Button type="button" variant="secondary" className="h-8 px-3" onClick={handleArchiveToggle}>
                      <Archive size={16} className="mr-1" />
                      Unarchive
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" className="h-8 px-3" onClick={() => setShowEditSheet(true)}>
                      <Pencil size={16} className="mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button type="button" variant="destructive" className="h-8 px-3" onClick={handleDelete}>
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {node && <CreateControlObjectiveSheet open={showEditSheet} onOpenChange={setShowEditSheet} editData={node} />}
    </>
  )
}

export default ControlObjectiveDetailsSheet
