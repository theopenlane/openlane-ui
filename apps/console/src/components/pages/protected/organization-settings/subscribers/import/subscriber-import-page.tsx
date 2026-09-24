'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVSubscriber } from '@/lib/graphql-hooks/subscriber'

const SubscriberImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVSubscriber()

  return <RecordImportPage entityType={ObjectTypes.SUBSCRIBER} onImport={(input) => mutateAsync({ input })} />
}

export default SubscriberImportPage
