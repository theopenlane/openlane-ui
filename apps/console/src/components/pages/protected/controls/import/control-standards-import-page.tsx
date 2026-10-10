'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { controlsFromStandardsImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { useCloneBulkCSVControl } from '@/lib/graphql-hooks/control'
import { type TMappedImport } from '@/components/shared/record-import/lib/types'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { CONTROL_STANDARDS_IMPORT_DESTINATION } from './control-standards-import-destination'

const ControlStandardsImportPage: React.FC = () => {
  const { mutateAsync } = useCloneBulkCSVControl()

  const handleImport = async (mapped: TMappedImport) => {
    const { cloneBulkCSVControl } = await mutateAsync({ input: mapped.toFile() })
    if (cloneBulkCSVControl.controls?.length) return

    throw new UserFacingError('No controls were cloned. Check that every row names a supported standard and a ref code from that standard.')
  }

  return <RecordImportPage entityType={ObjectTypes.CONTROL} route={controlsFromStandardsImportRoute} destination={CONTROL_STANDARDS_IMPORT_DESTINATION} onImport={handleImport} />
}

export default ControlStandardsImportPage
