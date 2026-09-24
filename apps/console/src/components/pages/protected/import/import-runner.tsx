'use client'

import React, { type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportSkeleton } from '@/components/shared/record-import/record-import-page'
import { type TImportableObjectType } from '@/components/shared/record-import/lib/import-routes'

const loading = () => <RecordImportSkeleton />

const IMPORT_RUNNERS: Record<TImportableObjectType, ComponentType> = {
  [ObjectTypes.ACTION_PLAN]: dynamic(() => import('@/components/pages/protected/action-plans/import/action-plan-import-page'), { loading }),
  [ObjectTypes.ASSET]: dynamic(() => import('@/components/pages/protected/assets/import/asset-import-page'), { loading }),
  [ObjectTypes.CONTACT]: dynamic(() => import('@/components/pages/protected/contacts/import/contact-import-page'), { loading }),
  [ObjectTypes.CONTROL]: dynamic(() => import('@/components/pages/protected/controls/import/control-import-page'), { loading }),
  [ObjectTypes.ENTITY]: dynamic(() => import('@/components/pages/protected/vendors/import/vendor-import-page'), { loading }),
  [ObjectTypes.EVIDENCE]: dynamic(() => import('@/components/pages/protected/evidence/import/evidence-import-page'), { loading }),
  [ObjectTypes.FINDING]: dynamic(() => import('@/components/pages/protected/findings/import/finding-import-page'), { loading }),
  [ObjectTypes.GROUP]: dynamic(() => import('@/components/pages/protected/groups/import/group-import-page'), { loading }),
  [ObjectTypes.IDENTITY_HOLDER]: dynamic(() => import('@/components/pages/protected/personnel/import/personnel-import-page'), { loading }),
  [ObjectTypes.INTERNAL_POLICY]: dynamic(() => import('@/components/pages/protected/policies/import/policy-import-page'), { loading }),
  [ObjectTypes.MAPPED_CONTROL]: dynamic(() => import('@/components/pages/protected/controls/import/mapped-control-import-page'), { loading }),
  [ObjectTypes.PROCEDURE]: dynamic(() => import('@/components/pages/protected/procedures/import/procedure-import-page'), { loading }),
  [ObjectTypes.REMEDIATION]: dynamic(() => import('@/components/pages/protected/remediations/import/remediation-import-page'), { loading }),
  [ObjectTypes.REVIEW]: dynamic(() => import('@/components/pages/protected/reviews/import/review-import-page'), { loading }),
  [ObjectTypes.RISK]: dynamic(() => import('@/components/pages/protected/risks/import/risk-import-page'), { loading }),
  [ObjectTypes.SCAN]: dynamic(() => import('@/components/pages/protected/scans/import/scan-import-page'), { loading }),
  [ObjectTypes.SUBSCRIBER]: dynamic(() => import('@/components/pages/protected/organization-settings/subscribers/import/subscriber-import-page'), { loading }),
  [ObjectTypes.SYSTEM_DETAIL]: dynamic(() => import('@/components/pages/protected/system-details/import/system-detail-import-page'), { loading }),
  [ObjectTypes.TASK]: dynamic(() => import('@/components/pages/protected/tasks/import/task-import-page'), { loading }),
  [ObjectTypes.TEMPLATE]: dynamic(() => import('@/components/pages/protected/questionnaire/import/template-import-page'), { loading }),
  [ObjectTypes.VULNERABILITY]: dynamic(() => import('@/components/pages/protected/vulnerabilities/import/vulnerability-import-page'), { loading }),
}

const VendorContactsImportPage = dynamic(() => import('@/components/pages/protected/vendors/detail/tabs/contacts/vendor-contacts-import-page'), { loading })

type TImportRunnerProps = {
  entityType: TImportableObjectType
  vendorId?: string
}

export const ImportRunner: React.FC<TImportRunnerProps> = ({ entityType, vendorId }) => {
  if (vendorId) return <VendorContactsImportPage key={vendorId} vendorId={vendorId} />

  const Runner = IMPORT_RUNNERS[entityType]
  return <Runner key={entityType} />
}
