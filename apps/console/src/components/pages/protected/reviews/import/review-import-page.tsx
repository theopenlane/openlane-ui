'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVReview } from '@/lib/graphql-hooks/review'

const ReviewImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVReview()

  return <RecordImportPage entityType={ObjectTypes.REVIEW} onImport={(input) => mutateAsync({ input })} />
}

export default ReviewImportPage
