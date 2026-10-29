'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { controlsUpdateImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { UPDATE_ID_FIELD } from '@/components/shared/record-import/lib/destination-fields'
import { IncompleteImportError } from '@/components/shared/record-import/lib/incomplete-import-error'
import { type TMappedImport } from '@/components/shared/record-import/lib/types'
import { getBulkUpdateErrorDescription, getBulkUpdateOutcome } from '@/components/shared/crud-base/bulk-action-feedback'
import { useUpdateBulkCSVControl } from '@/lib/graphql-hooks/control'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { formatTruncatedList, pluralizeWithCount } from '@/utils/strings'

const MAX_LISTED_IDS = 5

const idKey = (id: string) => id.trim().toLowerCase()

const ControlUpdateImportPage: React.FC = () => {
  const { mutateAsync } = useUpdateBulkCSVControl()

  const handleImport = async (mapped: TMappedImport) => {
    const requestedIDs = mapped
      .toRecords()
      .map((record) => record[UPDATE_ID_FIELD.name]?.trim())
      .filter((id): id is string => !!id)
    const { updateBulkCSVControl } = await mutateAsync({ input: mapped.toFile() })
    const { updatedIDs, notUpdatedIDs, error } = updateBulkCSVControl
    const outcome = getBulkUpdateOutcome({ requestedCount: requestedIDs.length, updatedIDs, notUpdatedIDs, error, singular: 'control' })
    if (outcome.status === 'success') return

    const updated = new Set((updatedIDs ?? []).map(idKey))
    const missedIDs = requestedIDs.filter((id) => !updated.has(idKey(id)))
    const reason = error ? ` ${getBulkUpdateErrorDescription(error)}` : ''
    const message = `${pluralizeWithCount(missedIDs.length, 'ID')} did not match a control you can edit: ${formatTruncatedList(missedIDs, missedIDs.length, MAX_LISTED_IDS)}.${reason}`
    if (outcome.status === 'failure') throw new UserFacingError(`${outcome.title} ${message}`)
    throw new IncompleteImportError(outcome.title, message)
  }

  return <RecordImportPage entityType={ObjectTypes.CONTROL} route={controlsUpdateImportRoute} onImport={handleImport} />
}

export default ControlUpdateImportPage
