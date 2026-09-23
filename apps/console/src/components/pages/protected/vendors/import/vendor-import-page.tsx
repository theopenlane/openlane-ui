'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVEntity } from '@/lib/graphql-hooks/entity'

const VendorImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVEntity()

  return <RecordImportPage entityType={ObjectTypes.ENTITY} onImport={(input) => mutateAsync({ input, entityTypeName: 'vendor' })} />
}

export default VendorImportPage
