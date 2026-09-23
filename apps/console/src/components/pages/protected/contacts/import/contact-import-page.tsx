'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVContact } from '@/lib/graphql-hooks/contact'

const ContactImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVContact()

  return <RecordImportPage entityType={ObjectTypes.CONTACT} onImport={(input) => mutateAsync({ input })} />
}

export default ContactImportPage
