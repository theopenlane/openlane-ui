'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVIdentityHolder } from '@/lib/graphql-hooks/identity-holder'

const PersonnelImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVIdentityHolder()

  return <RecordImportPage entityType={ObjectTypes.IDENTITY_HOLDER} onImport={(input) => mutateAsync({ input })} />
}

export default PersonnelImportPage
