'use client'

import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type CreateControlInput } from '@repo/codegen/src/schema'
import { RecordImportPage, RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { standardControlsImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { defineFixedImportField } from '@/components/shared/record-import/lib/import-registry'
import { useCreateBulkCSVControl } from '@/lib/graphql-hooks/control'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standard'
import { STANDARDS_CATALOG_HREF, isCustomStandard, standardDisplayName } from '../custom-framework'

const StandardControlsImportPage: React.FC<{ standardId: string }> = ({ standardId }) => {
  const { data, isPending, isError } = useGetStandardDetails(standardId)
  const { mutateAsync } = useCreateBulkCSVControl()

  const standard = data?.standard
  const standardName = standard ? standardDisplayName(standard) : undefined
  const route = standardControlsImportRoute(standardId, standardName)

  const fixedFields = useMemo(
    () => (standard ? [defineFixedImportField<CreateControlInput>({ field: 'standardID', label: 'Framework', value: standard.id, valueLabel: standard.name })] : []),
    [standard],
  )

  if (isPending) return <RecordImportSkeleton />

  if (isError || !standard) {
    return <RecordImportUnavailable message={<p>Framework not found.</p>} backHref={STANDARDS_CATALOG_HREF} backLabel="Back to Standards Catalog" />
  }

  if (!isCustomStandard(standard)) {
    return (
      <RecordImportUnavailable
        message={<p>{standardName} is provided by Openlane, so controls cannot be imported into it. Create a custom framework to import your own controls.</p>}
        backHref={route.listHref}
        backLabel={`Back to ${standardName}`}
      />
    )
  }

  return <RecordImportPage entityType={ObjectTypes.CONTROL} route={route} fixedFields={fixedFields} onImport={(mapped) => mutateAsync({ input: mapped.toFile() })} />
}

export default StandardControlsImportPage
