'use client'

import React, { type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { IMPORT_TRUST_CENTER_PARAM, IMPORT_VENDOR_PARAM, type TImportableObjectType, type TImportScope, type TImportScopeParam } from '@/components/shared/record-import/lib/import-routes'

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
  [ObjectTypes.TRUST_CENTER_FAQ]: dynamic(() => import('@/components/pages/protected/trust-center/faqs/import/faq-import-page'), { loading }),
  [ObjectTypes.TRUST_CENTER_NDA_REQUEST]: dynamic(() => import('@/components/pages/protected/trust-center/NDAs/import/nda-import-page'), { loading }),
  [ObjectTypes.TRUST_CENTER_SUBPROCESSOR]: dynamic(() => import('@/components/pages/protected/trust-center/subprocessors/import/subprocessor-import-page'), { loading }),
  [ObjectTypes.VULNERABILITY]: dynamic(() => import('@/components/pages/protected/vulnerabilities/import/vulnerability-import-page'), { loading }),
}

const VendorContactsImportPage = dynamic(() => import('@/components/pages/protected/vendors/detail/tabs/contacts/vendor-contacts-import-page'), { loading })
const TrustCenterSubscribersImportPage = dynamic(() => import('@/components/pages/protected/trust-center/subscribers/import/trust-center-subscribers-import-page'), { loading })

const VendorContactsRunner: React.FC<{ id: string }> = ({ id }) => <VendorContactsImportPage vendorId={id} />
const TrustCenterSubscribersRunner: React.FC<{ id: string }> = ({ id }) => <TrustCenterSubscribersImportPage trustCenterId={id} />

const SCOPED_IMPORT_RUNNERS: Record<TImportScopeParam, ComponentType<{ id: string }>> = {
  [IMPORT_VENDOR_PARAM]: VendorContactsRunner,
  [IMPORT_TRUST_CENTER_PARAM]: TrustCenterSubscribersRunner,
}

type TImportRunnerProps = {
  entityType: TImportableObjectType
  scope?: TImportScope
}

export const ImportRunner: React.FC<TImportRunnerProps> = ({ entityType, scope }) => {
  if (scope) {
    const ScopedRunner = SCOPED_IMPORT_RUNNERS[scope.param]
    return <ScopedRunner key={`${scope.param}:${scope.id}`} id={scope.id} />
  }

  const Runner = IMPORT_RUNNERS[entityType]
  return <Runner key={entityType} />
}
