'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import type { MergeableTypeName } from '@repo/codegen/src/merge-fields.generated'
import type { MergeConfig } from './types'
import type { MergeEdgeInputs } from './use-merge-edge-transfer'

type Args<TRecord, TUpdateInput, TEntity extends MergeableTypeName> = {
  config: MergeConfig<TRecord, TUpdateInput, TEntity>
  primaryId: string
  update: { mutateAsync: (vars: { id: string; input: TUpdateInput }) => Promise<unknown> }
  del: { mutateAsync: (id: string) => Promise<unknown> }
  readLatestEdgeInputs: () => Promise<MergeEdgeInputs<TEntity>>
  onFinished: () => void
}

export const useMergeRunner = <TRecord, TUpdateInput, TEntity extends MergeableTypeName>({
  config,
  primaryId,
  update,
  del,
  readLatestEdgeInputs,
  onFinished,
}: Args<TRecord, TUpdateInput, TEntity>) => {
  const [isMerging, setIsMerging] = useState(false)
  const queryClient = useQueryClient()
  const { successNotification, errorNotification, warningNotification } = useNotification()

  const runMerge = useCallback(
    async (secondaryId: string, fieldInput: TUpdateInput) => {
      setIsMerging(true)

      const invalidate = () => {
        for (const key of config.invalidateKeys ?? []) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }

      const finish = () => {
        setIsMerging(false)
        onFinished()
      }

      let edgeInputs: MergeEdgeInputs<TEntity>
      try {
        edgeInputs = await readLatestEdgeInputs()
      } catch (error) {
        setIsMerging(false)
        errorNotification({ title: 'Merge failed', description: `Could not re-read the linked records on the secondary ${config.labelSingular}: ${parseErrorMessage(error)}` })
        return
      }

      const hasEdges = Object.keys(edgeInputs.addInput).length > 0

      if (hasEdges) {
        if (Object.keys(edgeInputs.removeInput).length > 0) {
          try {
            await update.mutateAsync({ id: secondaryId, input: edgeInputs.removeInput as TUpdateInput })
          } catch (error) {
            setIsMerging(false)
            invalidate()
            errorNotification({
              title: 'Merge failed',
              description: `The linked records could not be unlinked from the secondary ${config.labelSingular}: ${parseErrorMessage(error)}. Nothing was changed or deleted.`,
            })
            return
          }
        }

        try {
          await update.mutateAsync({ id: primaryId, input: edgeInputs.addInput as TUpdateInput })
        } catch (error) {
          setIsMerging(false)
          invalidate()
          errorNotification({
            title: 'Merge failed',
            description: `The linked records were unlinked from the secondary ${config.labelSingular} but could not be moved to the primary: ${parseErrorMessage(error)}. Nothing was deleted; re-link them manually.`,
          })
          return
        }
      }

      if (config.deleteSecondaryFirst) {
        try {
          await del.mutateAsync(secondaryId)
        } catch (error) {
          invalidate()
          setIsMerging(false)
          errorNotification({ title: 'Merge failed', description: `The linked records were moved, but the secondary ${config.labelSingular} could not be deleted: ${parseErrorMessage(error)}` })
          return
        }

        try {
          await update.mutateAsync({ id: primaryId, input: fieldInput })
        } catch (error) {
          invalidate()
          warningNotification({
            title: 'Merge incomplete',
            description: `Linked records were moved and the secondary ${config.labelSingular} was deleted, but the field values could not be applied: ${parseErrorMessage(error)}. Apply them manually.`,
          })
          finish()
          return
        }

        invalidate()
        successNotification({ title: 'Merge complete', description: `The ${config.labelSingular} records were merged successfully.` })
        finish()
        return
      }

      try {
        await update.mutateAsync({ id: primaryId, input: fieldInput })
      } catch (error) {
        invalidate()
        setIsMerging(false)
        errorNotification({ title: 'Merge failed', description: `${parseErrorMessage(error)}. Nothing was deleted.` })
        return
      }

      let deleteFailed = false
      try {
        await del.mutateAsync(secondaryId)
      } catch (error) {
        deleteFailed = true
        warningNotification({
          title: 'Secondary not deleted',
          description: `The merge was applied to the primary record, but the secondary ${config.labelSingular} could not be deleted: ${parseErrorMessage(error)}. Please remove it manually.`,
        })
      }

      invalidate()

      if (!deleteFailed) {
        successNotification({ title: 'Merge complete', description: `The ${config.labelSingular} records were merged successfully.` })
      }

      finish()
    },
    [config, del, errorNotification, onFinished, primaryId, queryClient, readLatestEdgeInputs, successNotification, update, warningNotification],
  )

  return { isMerging, runMerge }
}
