'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVActionPlan } from '@/lib/graphql-hooks/action-plan'

const ActionPlanImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVActionPlan()

  return <RecordImportPage entityType={ObjectTypes.ACTION_PLAN} onImport={(input) => mutateAsync({ input })} />
}

export default ActionPlanImportPage
