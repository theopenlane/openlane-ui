'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { OrderDirection, TrustCenterFaqOrderField } from '@repo/codegen/src/schema'
import { RecordImportPage, RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { type TMappedImport } from '@/components/shared/record-import/lib/types'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useCreateBulkTrustCenterFaq, useTrustCenterFaqsWithFilter } from '@/lib/graphql-hooks/trust-center-faq'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { FAQ_AUTOMATIC_VALUES, FAQ_IMPORT_DESTINATION, toFaqInputs } from './faq-import-destination'

const LAST_FAQ_PAGE = { page: 1, pageSize: 1, query: { first: 1 } }
const LAST_FAQ_ORDER = [{ field: TrustCenterFaqOrderField.DISPLAY_ORDER, direction: OrderDirection.DESC }]

const FaqImportPage: React.FC = () => {
  const { trustCenter, isPending: isTrustCenterPending, isPlaceholderData, isError: isTrustCenterError } = useGetTrustCenter()
  const trustCenterID = trustCenter?.id
  const { data: permission, isPending: isPermissionPending } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterID)
  const { refetch: fetchLastFaq } = useTrustCenterFaqsWithFilter({
    where: { hasTrustCenterWith: [{ id: trustCenterID }], displayOrderNotNil: true },
    orderBy: LAST_FAQ_ORDER,
    pagination: LAST_FAQ_PAGE,
    enabled: !!trustCenterID,
  })
  const { mutateAsync: createFaqs } = useCreateBulkTrustCenterFaq()

  if (isTrustCenterPending || isPlaceholderData) return <RecordImportSkeleton />

  if (isTrustCenterError || !trustCenterID) {
    return <RecordImportUnavailable message={<p>Set up your Trust Center before importing FAQs.</p>} backHref="/trust-center/overview" backLabel="Back" />
  }

  const handleImport = async (mapped: TMappedImport) => {
    const { data } = await fetchLastFaq({ throwOnError: true })
    const lastDisplayOrder = data?.trustCenterFAQs?.edges?.[0]?.node?.displayOrder ?? 0
    return createFaqs({ input: toFaqInputs(mapped.toRecords(), { trustCenterID, displayOrder: lastDisplayOrder + 1 }) })
  }

  return (
    <RecordImportPage
      entityType={ObjectTypes.TRUST_CENTER_FAQ}
      roles={{ roles: permission?.roles, isPending: isPermissionPending }}
      destination={FAQ_IMPORT_DESTINATION}
      automaticValues={FAQ_AUTOMATIC_VALUES}
      onImport={handleImport}
    />
  )
}

export default FaqImportPage
