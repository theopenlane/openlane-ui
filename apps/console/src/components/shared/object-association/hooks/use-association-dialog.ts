import { useCallback, useMemo, useState } from 'react'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { getAssociationDiffs, getAssociationInput } from '@/components/shared/object-association/utils'
import { useNotification } from '@/hooks/useNotification.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type UseAssociationDialogOptions = {
  associationsState: TObjectAssociationMap
  initialAssociationsState: TObjectAssociationMap
  refCodeAssociationsState: TObjectAssociationMap
  entityId?: string
  onSave: (associationInputs: Record<string, string[]>) => Promise<void>
  onStateSave?: (associations: TObjectAssociationMap, refCodes: TObjectAssociationMap) => void
  successMessage: { title: string; description: string }
}

export const useAssociationDialog = ({ associationsState, initialAssociationsState, refCodeAssociationsState, entityId, onSave, onStateSave, successMessage }: UseAssociationDialogOptions) => {
  const { successNotification, errorNotification } = useNotification()
  const [associations, setAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)

  const hasChanges = useMemo(() => {
    const { added, removed } = getAssociationDiffs(initialAssociationsState, associations.associations)
    return Object.keys(added).length > 0 || Object.keys(removed).length > 0
  }, [initialAssociationsState, associations.associations])

  const handleDialogChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setAssociations({
          associations: associationsState,
          refCodes: refCodeAssociationsState,
        })
      } else {
        setAssociations({
          associations: {},
          refCodes: {},
        })
      }
      setOpen(isOpen)
    },
    [associationsState, refCodeAssociationsState],
  )

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setAssociations({ associations: updatedMap, refCodes })
  }, [])

  const handleSave = useCallback(async () => {
    onStateSave?.(associations.associations, associations.refCodes)

    if (entityId) {
      try {
        const associationInputs = getAssociationInput(initialAssociationsState, associations.associations)
        await onSave(associationInputs as Record<string, string[]>)
        successNotification(successMessage)
        setOpen(false)
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    } else {
      setOpen(false)
    }
  }, [associations, entityId, initialAssociationsState, onSave, onStateSave, successMessage, successNotification, errorNotification])

  return {
    open,
    setOpen,
    hasChanges,
    handleDialogChange,
    handleIdChange,
    handleSave,
    associationsState,
    refCodeAssociationsState,
  }
}
