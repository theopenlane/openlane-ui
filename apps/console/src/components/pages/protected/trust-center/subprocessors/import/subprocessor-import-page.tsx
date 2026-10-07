'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ImportPageGate } from '@/components/shared/record-import/import-page-gate'
import { IMPORT_ROUTES } from '@/components/shared/record-import/lib/import-routes'
import TrustCenter from '@/components/pages/protected/trust-center/trust-center'
import { SubprocessorImportFlow } from './subprocessor-import-flow'

const route = IMPORT_ROUTES[ObjectTypes.TRUST_CENTER_SUBPROCESSOR]

const SubprocessorImportPage: React.FC = () => (
  <ImportPageGate route={route}>
    <TrustCenter>
      <SubprocessorImportFlow route={route} />
    </TrustCenter>
  </ImportPageGate>
)

export default SubprocessorImportPage
