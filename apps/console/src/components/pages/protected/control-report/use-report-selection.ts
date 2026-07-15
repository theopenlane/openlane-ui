import { useCallback, useState } from 'react'
import { useBulkEditControl, useSubcontrolIdFetcher } from '@/lib/graphql-hooks/control'
import { useBulkEditSubcontrol } from '@/lib/graphql-hooks/subcontrol'
import { useNotification } from '@/hooks/useNotification'
import { type ControlControlStatus, SubcontrolControlStatus } from '@repo/codegen/src/schema'

type UseReportSelectionArgs = {
  mappedControlIdsByControl: Map<string, string[]>
}

export type BulkActionInput = { controlOwnerID?: string; status?: ControlControlStatus; addProgramIDs?: string[] }
export type BulkActionOptions = { subcontrols: boolean; mappedControls: boolean }

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

      const subcontrolInput = {
        ...(input.controlOwnerID ? { controlOwnerID: input.controlOwnerID } : {}),
        ...(input.status ? { status: SubcontrolControlStatus[input.status] } : {}),
      }
      const hasSubcontrolChanges = Object.keys(subcontrolInput).length > 0

      try {
        const mappedControlIds = options.mappedControls && ids.length > 0 ? [...new Set(ids.flatMap((id) => mappedControlIdsByControl.get(id) ?? []))] : []
        const parentIds = options.subcontrols && hasSubcontrolChanges ? [...new Set([...ids, ...mappedControlIds])] : []

        const [, , cascadeSubIds] = await Promise.all([
          ids.length > 0 ? bulkEditControl({ ids, input }) : Promise.resolve(),
          mappedControlIds.length > 0 ? bulkEditControl({ ids: mappedControlIds, input }) : Promise.resolve(),
          parentIds.length > 0 ? fetchSubcontrolIds(parentIds) : Promise.resolve<string[]>([]),
        ])

        if (hasSubcontrolChanges) {
          const allSubIds = [...new Set([...cascadeSubIds, ...subIds])]
          if (allSubIds.length > 0) {
            await bulkEditSubcontrol({ ids: allSubIds, input: subcontrolInput })
          }
        }

        const parts = []
        if (ids.length > 0) parts.push(`${ids.length} control${ids.length > 1 ? 's' : ''}`)
        if (subIds.length > 0 && hasSubcontrolChanges) parts.push(`${subIds.length} subcontrol${subIds.length > 1 ? 's' : ''}`)
        if (parts.length > 0) {
          successNotification({ title: 'Updated', description: `${parts.join(' and ')} updated` })
        }
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
