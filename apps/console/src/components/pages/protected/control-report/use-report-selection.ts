import { useCallback, useState } from 'react'
import { useBulkEditControl, useBulkEditSubcontrol, useSubcontrolIdFetcher } from '@/lib/graphql-hooks/control'
import { useNotification } from '@/hooks/useNotification'
import { type ControlControlStatus, SubcontrolControlStatus } from '@repo/codegen/src/schema'

type UseReportSelectionArgs = {
  mappedControlIdsByControl: Map<string, string[]>
}

type BulkActionInput = { controlOwnerID?: string; status?: ControlControlStatus }
type BulkActionOptions = { subcontrols: boolean; mappedControls: boolean }

export const useReportSelection = ({ mappedControlIdsByControl }: UseReportSelectionArgs) => {
  const [selectedControlIds, setSelectedControlIds] = useState<Set<string>>(() => new Set())
  const [selectedSubcontrolIds, setSelectedSubcontrolIds] = useState<Set<string>>(() => new Set())
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { mutateAsync: bulkEditSubcontrol } = useBulkEditSubcontrol()
  const fetchSubcontrolIds = useSubcontrolIdFetcher()
  const { successNotification, errorNotification } = useNotification()

  const toggleControlSelection = useCallback((id: string, checked: boolean) => {
    setSelectedControlIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const toggleSubcontrolSelection = useCallback((id: string, checked: boolean) => {
    setSelectedSubcontrolIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const batchSelectSubcontrols = useCallback((ids: string[], checked: boolean) => {
    setSelectedSubcontrolIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const setSelectionForCategory = useCallback((ids: string[], checked: boolean) => {
    setSelectedControlIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedControlIds(new Set())
    setSelectedSubcontrolIds(new Set())
  }, [])

  const handleBulkAction = useCallback(
    async (input: BulkActionInput, options: BulkActionOptions) => {
      const ids = [...selectedControlIds]
      const subIds = [...selectedSubcontrolIds]
      if (ids.length === 0 && subIds.length === 0) return
      try {
        if (ids.length > 0) {
          await bulkEditControl({ ids, input })
        }

        const subcontrolInput = {
          ...(input.controlOwnerID ? { controlOwnerID: input.controlOwnerID } : {}),
          ...(input.status ? { status: SubcontrolControlStatus[input.status] } : {}),
        }

        let mappedControlIds: string[] = []
        if (options.mappedControls && ids.length > 0) {
          mappedControlIds = [...new Set(ids.flatMap((id) => mappedControlIdsByControl.get(id) ?? []))]
          if (mappedControlIds.length > 0) {
            await bulkEditControl({ ids: mappedControlIds, input })
          }
        }

        if (options.subcontrols) {
          const parentIds = [...new Set([...ids, ...mappedControlIds])]
          const cascadeSubIds = parentIds.length > 0 ? await fetchSubcontrolIds(parentIds) : []
          const allSubIds = [...new Set([...cascadeSubIds, ...subIds])]
          if (allSubIds.length > 0) {
            await bulkEditSubcontrol({ ids: allSubIds, input: subcontrolInput })
          }
        } else if (subIds.length > 0) {
          await bulkEditSubcontrol({ ids: subIds, input: subcontrolInput })
        }

        const parts = []
        if (ids.length > 0) parts.push(`${ids.length} control${ids.length > 1 ? 's' : ''}`)
        if (subIds.length > 0) parts.push(`${subIds.length} subcontrol${subIds.length > 1 ? 's' : ''}`)
        successNotification({ title: 'Updated', description: `${parts.join(' and ')} updated` })
        clearSelection()
      } catch {
        errorNotification({ title: 'Error', description: 'Failed to apply bulk update' })
      }
    },
    [selectedControlIds, selectedSubcontrolIds, bulkEditControl, bulkEditSubcontrol, fetchSubcontrolIds, mappedControlIdsByControl, successNotification, errorNotification, clearSelection],
  )

  return {
    selectedControlIds,
    selectedSubcontrolIds,
    toggleControlSelection,
    toggleSubcontrolSelection,
    batchSelectSubcontrols,
    setSelectionForCategory,
    clearSelection,
    handleBulkAction,
  }
}
