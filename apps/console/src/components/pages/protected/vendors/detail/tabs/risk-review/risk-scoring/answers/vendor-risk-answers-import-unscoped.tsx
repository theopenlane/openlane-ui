'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { IMPORT_ROUTES } from '@/components/shared/record-import/lib/import-routes'
import { UPLOAD_ANSWERS_LABEL } from './risk-scoring-actions'

const VendorRiskAnswersImportUnscoped: React.FC = () => (
  <RecordImportUnavailable
    message={<p>Risk answers are imported for one vendor at a time. Open a vendor&apos;s Risk Review tab and choose {UPLOAD_ANSWERS_LABEL}.</p>}
    backHref={IMPORT_ROUTES[ObjectTypes.ENTITY].listHref}
    backLabel="Back to Vendors"
  />
)

export default VendorRiskAnswersImportUnscoped
