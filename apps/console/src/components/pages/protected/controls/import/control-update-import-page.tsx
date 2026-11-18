'use client'

import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { controlsUpdateImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { UPDATE_ID_FIELD } from '@/components/shared/record-import/lib/destination-fields'
import { IncompleteImportError } from '@/components/shared/record-import/lib/incomplete-import-error'
import { type TMappedImport } from '@/components/shared/record-import/lib/types'
import type { TExistingRecord, TUpdateLookupKeys, TUpdateRecordSource } from '@/components/shared/record-import/lib/update-preview'
import { getBulkUpdateErrorDescription, getBulkUpdateOutcome } from '@/components/shared/crud-base/bulk-action-feedback'
import { CONTROL_IMPORT_PREVIEW_QUERY_KEY, useControlImportPreviewFetcher, useUpdateBulkCSVControl, type ControlImportPreviewNode } from '@/lib/graphql-hooks/control'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { formatTruncatedList, pluralizeWithCount } from '@/utils/strings'

const MAX_LISTED_IDS = 5
const REF_CODE_FIELD = controlsUpdateImportRoute.updateLookup?.field

const idKey = (id: string) => id.trim().toLowerCase()

const toExistingRecord = ({ id, ...values }: ControlImportPreviewNode): TExistingRecord => ({
  id,
  label: values.title ? `${values.refCode} — ${values.title}` : values.refCode,
  values,
})

const ControlUpdateImportPage: React.FC = () => {
  const { mutateAsync } = useUpdateBulkCSVControl()
  const fetchControls = useControlImportPreviewFetcher()

  const updateSource = useMemo(
    (): TUpdateRecordSource => ({
      queryKey: CONTROL_IMPORT_PREVIEW_QUERY_KEY,
      fetchRecords: async ({ ids, lookups }: TUpdateLookupKeys) => {
        const [byId, byLookup] = await Promise.all([
          ids.length > 0 ? fetchControls(ids, (batch) => ({ idIn: batch })) : [],
          lookups.length > 0 ? fetchControls(lookups, (batch) => ({ refCodeIn: batch, referenceFrameworkIsNil: true, or: [{ systemOwned: false }, { systemOwnedIsNil: true }] })) : [],
        ])
        return { byId: byId.map(toExistingRecord), byLookup: byLookup.map(toExistingRecord) }
      },
    }),
    [fetchControls],
  )

  const handleImport = async (mapped: TMappedImport) => {
    const requested = mapped.toRecords().flatMap((record) => {
      const id = record[UPDATE_ID_FIELD.name]?.trim()
      return id ? [{ id, label: (REF_CODE_FIELD && record[REF_CODE_FIELD]?.trim()) || id }] : []
    })
    const { updateBulkCSVControl } = await mutateAsync({ input: mapped.toFile() })
    const { updatedIDs, notUpdatedIDs, error } = updateBulkCSVControl
    const outcome = getBulkUpdateOutcome({ requestedCount: requested.length, updatedIDs, notUpdatedIDs, error, singular: 'control' })
    if (outcome.status === 'success') return

    const updated = new Set((updatedIDs ?? []).map(idKey))
    const missed = requested.filter(({ id }) => !updated.has(idKey(id))).map(({ label }) => label)
    const reason = error ? ` ${getBulkUpdateErrorDescription(error)}` : ''
    const message = `${pluralizeWithCount(missed.length, 'control')} could not be updated: ${formatTruncatedList(missed, missed.length, MAX_LISTED_IDS)}.${reason}`
    if (outcome.status === 'failure') throw new UserFacingError(`${outcome.title} ${message}`)
    throw new IncompleteImportError(outcome.title, message)
  }

  return <RecordImportPage entityType={ObjectTypes.CONTROL} route={controlsUpdateImportRoute} updateSource={updateSource} onImport={handleImport} />
}

export default ControlUpdateImportPage
