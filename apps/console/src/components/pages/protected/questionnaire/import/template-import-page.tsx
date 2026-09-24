'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVTemplate } from '@/lib/graphql-hooks/template'

const TemplateImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVTemplate()

  return <RecordImportPage entityType={ObjectTypes.TEMPLATE} onImport={(input) => mutateAsync({ input })} />
}

export default TemplateImportPage
